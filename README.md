# local_llm_app

Local LLM(Ollama) 기반 앱 만들기 실무 실습 자료입니다. FastAPI 백엔드, React 프론트엔드, Ollama 연동 스크립트(STT/TTS/이미지 생성 포함) 등 여러 개의 독립 실습 프로젝트로 구성되어 있습니다.

## 폴더 구조

| 폴더 | 설명 |
| --- | --- |
| `backend/` | Ollama 연동 채팅 API (FastAPI). `/chat`, `/models` 엔드포인트 제공 |
| `frontend/` | `backend`와 통신하는 채팅 UI (React + Vite) |

## 사전 요구사항

- Python 3.12 이상
- Node.js 18 이상 (`npm` 포함)
- [Ollama](https://ollama.com/download) (로컬 LLM 실행용)
- (선택) `ffmpeg` — 음성 관련 실습(`ollama_basic/3-*.py`)에서 오디오 처리에 필요할 수 있음

## 1. Ollama 설치 및 모델 준비

1. [ollama.com/download](https://ollama.com/download)에서 OS에 맞는 설치 파일을 내려받아 설치합니다.
2. 설치 후 Ollama가 백그라운드에서 실행 중인지 확인합니다. (`http://localhost:11434` 로 접근 가능해야 함)
3. 실습에 사용할 모델을 미리 내려받습니다. (`backend/ollama_chat.py`의 기본 모델은 `exaone3.5:7.8b` 이며, 필요에 따라 원하는 모델로 교체 가능)

- VRAM 8GB인경우 
```bash
ollama pull exaone3.5:7.8b  
ollama pull qwen3.5:8b         
ollama pull gemma4:e2b      
```


## 2. Python 프로젝트 설정 (uv)
- **`uv init` → `uv add` → `uv run`** 워크플로우를 기준으로 합니다. 
- 가상환경은 `uv run`/`uv add` 실행 시 자동으로 생성·동기화되므로 수동 activate가 필요 없습니다.
### backend폴더 생성
```
mkdir backend
cd backend
```

### 프로젝트 초기화 
프로젝트 루트에서 실행합니다. `--bare` 옵션은 이미 존재하는 `README.md`/`.gitignore`를 덮어쓰지 않기 위함입니다.

```bash
uv init --bare --python 3.12 --name ollama-chabot
```

`pyproject.toml`이 생성되며, 이후 `uv add`를 실행하면 `.venv`와 `uv.lock`이 자동으로 만들어집니다.

### 패키지 추가 (uv add)

실습 폴더별로 필요한 패키지가 다릅니다. 사용할 폴더에 맞춰 추가하세요.

```bash
# backend/ : Ollama 채팅 API
uv add "fastapi[standard]" uvicorn ollama requests
uv add sqlalchemy oracledb
```

> `fastapi[standard]`에는 `uvicorn`이 포함되어 있어 별도로 추가할 필요가 없습니다.
> 모든 패키지는 루트의 `pyproject.toml` 한 곳에 기록되며, 실습 폴더를 옮겨 다녀도 같은 `.venv`를 공유합니다.

## 3. 프론트엔드 설정 (Node.js)
- 프로젝트 베이스 폴더에서 frontedn 폴더 생성
```bash
cd frontend
npm install
```

## 4. 실행 방법

### 채팅 앱 (backend + frontend)

```bash
# 1) Ollama가 실행 중인지 확인
systemctl is-active ollama
또는
systemctl status ollama

# 2) 백엔드 실행
cd backend
uv run uvicorn main:app --reload --port 8000

# 3) 프론트엔드 실행 (새 터미널)
cd frontend
npm run dev
```

- 백엔드: http://localhost:8000 (API 문서: http://localhost:8000/docs)
- 프론트엔드: http://localhost:5173

백엔드의 CORS 설정(`backend/main.py`)은 `http://localhost:5173`만 허용하므로, 프론트엔드 개발 서버 포트를 변경한 경우 함께 수정해야 합니다.
```
