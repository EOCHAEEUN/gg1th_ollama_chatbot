from typing import Literal

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────
# [멀티턴 추가] 대화 한 줄을 표현하는 모델
# ─────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    # Literal["user", "assistant"] = "이 두 값만 허용한다"는 뜻입니다.
    # 왜 str이 아니라 Literal로 막았나? (보안상 중요)
    #   만약 str로 열어두면 프론트엔드나 외부에서 role="system"인 메시지를
    #   history에 섞어 보낼 수 있습니다. 그러면 우리가 정한 system_prompt를
    #   무시하고 모델의 역할을 마음대로 바꿔버릴 수 있습니다.
    #   (프롬프트 인젝션의 가장 흔한 형태)
    #   시스템 역할은 오직 아래 system_prompt 필드로만 지정되게 합니다.
    role: Literal["user", "assistant"] = Field(
        ..., description="메시지 작성자. user=사용자, assistant=AI"
    )
    content: str = Field(..., description="메시지 본문")


# ChatRequest 모델 설계
class ChatRequest(BaseModel):
    message: str = Field(..., description="사용자가 입력한 질문")

    # ── [멀티턴 추가] 과거 대화 목록 ──────────────────────────
    # default_factory=list 를 쓴 이유:
    #   default=[] 로 쓰면 그 리스트 하나를 모든 요청이 공유하게 됩니다.
    #   default_factory=list 는 "요청마다 새 빈 리스트를 만들어라"는 뜻이라 안전합니다.
    # 이 필드는 선택값이므로, 프론트가 history를 안 보내도 에러 없이 동작합니다.
    history: list[ChatMessage] = Field(
        default_factory=list,
        description="이전 대화 기록. 오래된 것부터 순서대로.",
    )

    model: str = Field(default="exaone3.5:7.8b", description="Ollama 모델명")
    system_prompt: str = Field(
        default="너는 초보자를 돕는 친절한 AI 강사다.",
        description="모델의 역할을 지정하는 시스템 프롬프트",
    )
    temperature: float = Field(default=0.6, ge=0.0, le=2.0)
    top_p: float = Field(default=0.7, ge=0.0, le=1.0)
    num_predict: int = Field(default=256, ge=1, le=2048)


# ChatResponse 모델 설계
class ChatResponse(BaseModel):
    model: str
    message: str
    elapsed_time: float
