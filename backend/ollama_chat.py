import time
from ollama import chat
import requests

def call_ollama_chat(
    message: str,
    # ── [멀티턴 추가] 과거 대화 목록 ──────────────────────────────
    # [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ...]
    # 받는 것은 pydantic 객체가 아니라 평범한 dict들의 리스트입니다.
    # (main.py에서 .model_dump()로 변환해서 넘겨줍니다)
    # 이 함수가 FastAPI를 모르게 해두면, 나중에 CLI나 테스트 코드에서도
    # 그냥 dict를 만들어 호출할 수 있습니다. 아래 __main__ 테스트가 그 예입니다.
    # 기본값을 []가 아니라 None으로 둔 이유:
    #   파이썬에서 기본값으로 리스트를 쓰면(=가변 기본 인자) 그 리스트 하나를
    #   모든 호출이 "공유"해서, 앞선 호출의 대화가 다음 호출에 새어 들어갑니다.
    #   그래서 None으로 받고 함수 안에서 매번 새 리스트를 만듭니다.
    history: list[dict] | None = None,
    model: str = "exaone3.5:7.8b",
    system_prompt: str = "너는 초보자를 돕는 친절한 AI 강사다.",
    temperature: float = 0.6,
    top_p: float = 0.7,
    num_predict: int = 256,
    # ── [멀티턴 추가] 과거 대화를 몇 개까지 보낼지 ─────────────────
    # 10 = 메시지 10개 = 대략 5턴(user+assistant가 한 쌍).
    # 왜 자르나?
    #   1) 모델이 한 번에 읽을 수 있는 양(컨텍스트 윈도우)에 한계가 있음
    #   2) 보내는 양이 많아질수록 8GB VRAM 환경에서 응답이 느려짐
    #   실무에서도 "최근 N개만 보내기"는 가장 기본적인 대화 관리 방법입니다.
    max_history: int = 10,
):
  """과거 대화(history)를 포함해 Ollama에 요청하고, 응답과 소요 시간을 반환한다."""

  # ── [멀티턴 추가] history 정리 ────────────────────────────────
  # history가 None이면 빈 리스트로 바꿔서 아래 코드가 똑같이 동작하게 함
  history = history or []
  # 리스트 슬라이싱 [-10:] = "뒤에서 10개만".
  # 항목이 10개보다 적어도 에러 없이 있는 만큼만 가져옵니다.
  recent_history = history[-max_history:]

  # ── [멀티턴 핵심] 모델에게 보낼 messages 배열 조립 ──────────────
  # LLM은 기억이 없습니다. 매번 "지금까지의 대화 전체"를 다시 보내줘야
  # 이전 내용을 아는 것처럼 행동합니다. 순서가 곧 대화의 흐름입니다.
  #
  #   [system]    ← 역할 지정 (항상 맨 앞, 딱 1개)
  #   [user]      ← 과거 질문 ┐
  #   [assistant] ← 과거 답변 ┘ recent_history가 이 자리에 펼쳐짐
  #   [user]      ← 이번 질문 (항상 맨 뒤)
  #
  # *recent_history 의 별표(*)는 "리스트를 펼쳐서 넣어라"는 뜻입니다.
  #   *[a, b] → a, b  (리스트를 통째로 넣는 게 아니라 원소를 하나씩 풀어서 넣음)
  messages = [
      {"role": "system", "content": system_prompt},
      *recent_history,
      {"role": "user", "content": message},
  ]

  # time.perf_counter()를 사용하여 시작 시간 측정
  start_time = time.perf_counter()

  # Ollama chat() 함수 호출
  # [변경점] 예전에는 messages=[...]를 여기에 직접 적었지만,
  #          이제는 위에서 조립한 messages 변수를 넘깁니다.
  response = chat(
      model=model,
      messages=messages,
      options={"temperature": temperature,
               "top_p": top_p,
               "num_predict": num_predict},
      think=False
  )

  # ollama 응답 시간 측정
  elapsed_time = round(time.perf_counter() - start_time, 3)

  return {
      "model": model,
      "message": response.message.content,
      "elapsed_time": elapsed_time,
  }


# 로컬의 모델 목록 가져오기

OLLAMA_TAGS_URL = "http://localhost:11434/api/tags"
def get_ollama_models():
  """Ollama API를 통해 로컬 모델 목록을 가져온다."""
  response = requests.get(
    OLLAMA_TAGS_URL,
    timeout=30
  )
  # 응답 실패(4xx/5xx)를 여기서 즉시 예외로 전환
  response.raise_for_status()

  data = response.json()
  # print(data)

  models = data.get("models", [])

  models_list = [ model["name"] for model in models]

  return models_list


# ─────────────────────────────────────────────────────────────
# 멀티턴(대화 기억) 동작 확인용 테스트
# 실행: uv run ollama_chat.py
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
  # 대화 기록을 담을 빈 리스트로 시작 (아직 대화한 게 없으므로)
  history = []

  # --- 1턴: 정보를 알려준다 ---
  question_1 = "내가 좋아하는 과일은 귤이야. 기억해줘."
  result_1 = call_ollama_chat(message=question_1, history=history)
  print("\n[1턴 질문]", question_1)
  print("[1턴 답변]", result_1["message"])

  # 방금 주고받은 대화를 history에 쌓습니다. 이 작업을 안 하면
  # 다음 호출에서 모델은 1턴 내용을 전혀 모릅니다.
  # (실제 앱에서는 이 역할을 프론트엔드의 messages state가 합니다)
  history.append({"role": "user", "content": question_1})
  history.append({"role": "assistant", "content": result_1["message"]})

  # --- 2턴: history를 함께 보내면 → 기억함 ---
  question_2 = "내가 좋아하는 과일이 뭐라고 했지?"
  result_2 = call_ollama_chat(message=question_2, history=history)
  print("\n[2턴 질문]", question_2)
  print("[2턴 답변 / history 있음]", result_2["message"])
  print("  → '귤'이라고 답하면 멀티턴 성공입니다.")

  # --- 비교군: 똑같은 질문인데 history를 안 보내면 → 모름 ---
  # 이 차이를 눈으로 확인하는 게 이 테스트의 핵심입니다.
  result_3 = call_ollama_chat(message=question_2, history=[])
  print("\n[같은 질문 / history 없음]", result_3["message"])
  print("  → 모른다고 답해야 정상입니다. LLM에게 기억이 없다는 증거.")
