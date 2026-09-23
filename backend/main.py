from fastapi import FastAPI, HTTPException
# ── [CORS 추가] 브라우저의 교차 출처 차단을 풀어주는 미들웨어 ──
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
# ollama_chat 모듈의 call_ollama_chat 함수 로딩
from ollama_chat import call_ollama_chat, get_ollama_models
from schema import ChatRequest, ChatResponse


# FastAPI 객체 생성
app = FastAPI(
    title="Local LLM Chat API",
    description="Ollama 기반 로컬 LLM 채팅 백엔드 API",
    version="0.1.0",
)

# ─────────────────────────────────────────────────────────────
# [CORS 추가] 프론트엔드에서 이 API를 호출할 수 있게 허용
#
# 왜 필요한가?
#   브라우저에는 "같은 출처(origin)끼리만 요청할 수 있다"는 보안 규칙이
#   있습니다. 출처 = 프로토콜 + 도메인 + 포트.
#     프론트: http://localhost:5173  (Vite 개발 서버)
#     백엔드: http://127.0.0.1:8000  (이 FastAPI 서버)
#   포트가 다르므로 서로 "다른 출처"이고, 설정 없이 fetch를 하면
#   브라우저가 응답을 막고 콘솔에 CORS 에러를 띄웁니다.
#   (Postman이나 curl은 브라우저가 아니라서 이 에러가 안 납니다.
#    "터미널에서는 되는데 화면에서만 안 돼요"의 대부분이 이 문제입니다.)
#
# allow_origins에 localhost와 127.0.0.1을 둘 다 적은 이유:
#   둘은 같은 내 컴퓨터를 가리키지만 브라우저는 글자가 다르면
#   다른 출처로 취급합니다. 주소창에 뭘 치든 되게 하려고 둘 다 넣었습니다.
#
# 주의: allow_origins=["*"] (전체 허용)는 개발 중엔 편하지만
#       실제 배포 때는 쓰지 마세요. 아무 사이트나 이 API를 부를 수 있게 됩니다.
# ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],   # GET, POST 등 모든 HTTP 메서드 허용
    allow_headers=["*"],   # Content-Type 등 모든 헤더 허용
)


# /chat API 구현
@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
      return_value = call_ollama_chat(
              message=request.message,
              # ── [멀티턴 추가] 과거 대화를 dict로 바꿔서 넘김 ──────────
              #
              # request.history의 정체:
              #   프론트가 보낸 JSON을 FastAPI가 검증하면서
              #   ChatMessage "객체"들의 리스트로 만들어 줍니다.
              #     {"role":"user","content":"안녕"}          (프론트가 보낸 JSON)
              #       → ChatMessage(role='user', content='안녕')  (FastAPI가 만든 객체)
              #   이 검증 단계가 role="system" 주입을 막아주는 곳입니다.
              #
              # .model_dump() = pydantic 객체를 다시 평범한 dict로 되돌리는 메서드
              #     ChatMessage(role='user', content='안녕')
              #       → {"role": "user", "content": "안녕"}
              #
              # [m.model_dump() for m in ...] = 리스트 컴프리헨션.
              #   for문을 한 줄로 줄인 문법이고, 아래와 완전히 같은 뜻입니다.
              #     result = []
              #     for m in request.history:
              #         result.append(m.model_dump())
              #   읽을 때는 뒤쪽 for를 먼저, 앞쪽 변환을 나중에 읽으면 됩니다.
              #
              # 왜 굳이 dict로 되돌리나? (ollama가 객체를 못 받아서가 아닙니다.
              #   ollama도 내부적으로 pydantic을 쓰기 때문에 객체를 줘도 동작은 합니다.)
              #   1) 경계를 넘는 값은 순수한 파이썬 자료형으로 만들어 두는 게 안전합니다.
              #      call_ollama_chat은 "dict들의 리스트"를 받는다고 정해두면,
              #      나중에 ollama 말고 다른 라이브러리로 바꿔도 그대로 동작합니다.
              #   2) dict여야 m["role"] 같은 대괄호 접근이 됩니다. 객체는 TypeError가 납니다.
              #      (대화 기록을 잘라내거나 토큰을 세는 코드를 나중에 추가할 때 바로 걸립니다)
              #   3) dict여야 json.dumps()로 로그 저장이나 DB 기록이 가능합니다.
              history=[m.model_dump() for m in request.history],
              model=request.model,
              system_prompt=request.system_prompt,
              temperature=request.temperature,
              top_p=request.top_p,
              num_predict=request.num_predict,
          )

      return return_value
    except Exception as exc:
      raise HTTPException(
          status_code=500,
          detail=f"채팅 처리 중 오류가 발생했습니다: {exc}"
      )

# model 목록 가져오기
# http://localhost:8000/models
@app.get("/models")
def list_models():
    try:
       models = get_ollama_models()
       return {"models": models}
    except Exception as exc:
       raise HTTPException(
          status_code = 500,
          detail = f"모델 목록 조회 중 오류가 발생했습니다.: {exc}"
       )

# uv run main.py
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
