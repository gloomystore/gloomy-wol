# Gloomy WoL

Wake-on-LAN 장치 관리 웹 애플리케이션

네트워크 장치를 등록하고, 매직 패킷을 전송하여 원격으로 깨우고, 실시간으로 온/오프라인 상태를 모니터링할 수 있습니다.

A full-stack Wake-on-LAN device management web application. Register network devices, send magic packets to wake them remotely, and monitor their online/offline status in real-time.

## Features

### Wake-on-LAN
- WoL 매직 패킷 전송 (6 bytes 0xFF + MAC 주소 16회 반복)
- 재전송 횟수 및 간격 설정 (1~10회, 100~5000ms)
- 브로드캐스트 주소 및 UDP 포트 커스터마이징
- 전송 이력 추적 (성공/실패, 에러 메시지, 타임스탬프)

### Real-time Status Monitoring
- ICMP Ping + TCP 포트 프로빙 (22, 80, 135, 139, 445, 3389, 8080)을 통한 복합 상태 감지
- Server-Sent Events (SSE)를 통한 실시간 상태 업데이트
- 적응형 폴링 (WoL 전송 후 1초 간격 -> 평상시 10초 간격)
- Page Visibility API 연동 (탭 비활성 시 폴링 자동 중지)

### Device Management
- 장치 CRUD (생성, 조회, 수정, 삭제)
- 즐겨찾기 및 커스텀 정렬
- 장치 메모/노트 지원
- 사용자별 장치 격리

### Authentication & Security
- JWT 기반 인증 (Access Token 15분 + Refresh Token 30일)
- bcrypt 비밀번호 해싱
- HTTP-only Secure 쿠키
- 미들웨어 기반 라우트 보호

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, TailwindCSS 4 |
| Database | MySQL (mysql2) |
| Auth | JWT (jose), bcryptjs |
| Validation | Zod 4, React Hook Form 7 |
| Deployment | PM2 (ecosystem.config.js) |

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+

### Installation

```bash
git clone https://github.com/gloomystore/gloomy-wol.git
cd gloomy-wol
npm install
```

### Environment Setup

```bash
cp .env.example .env.development
# .env.development 파일을 열고 실제 값으로 수정하세요
```

필요한 환경변수:

| Variable | Description |
|----------|-------------|
| `DB_HOST` | MySQL 호스트 |
| `DB_PORT` | MySQL 포트 |
| `DB_USER` | MySQL 사용자 |
| `DB_PASSWORD` | MySQL 비밀번호 |
| `DB_NAME` | 데이터베이스 이름 |
| `JWT_ACCESS_SECRET` | JWT Access Token 시크릿 (32자 이상) |
| `JWT_REFRESH_SECRET` | JWT Refresh Token 시크릿 (32자 이상) |
| `NEXT_PUBLIC_APP_URL` | 앱 URL |
| `APP_TZ` | 타임존 (예: Asia/Seoul) |

### Database Setup

```bash
mysql -u root -p < lib/db/schema.sql
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Project Structure

```
gloomy-wol/
├── app/
│   ├── (auth)/          # 로그인, 회원가입 페이지
│   ├── (main)/          # 대시보드, 장치 상세 페이지
│   ├── api/
│   │   ├── auth/        # 인증 API (login, register, logout, refresh, me)
│   │   ├── devices/     # 장치 API (CRUD, wake, status, history)
│   │   └── sse/         # Server-Sent Events 스트림
│   └── layout.tsx
├── components/
│   ├── devices/         # 장치 관련 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   ├── providers/       # Context Providers (Auth, Toast)
│   └── ui/              # 공통 UI 컴포넌트
├── hooks/               # 커스텀 React 훅
├── lib/
│   ├── auth/            # JWT, 비밀번호 유틸리티
│   ├── db/              # DB 연결 및 쿼리
│   ├── network/         # 네트워크 상태 체크
│   ├── validations/     # Zod 스키마
│   └── wol/             # 매직 패킷 생성
├── types/               # TypeScript 타입 정의
└── middleware.ts         # 인증 미들웨어
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| POST | `/api/auth/refresh` | 토큰 갱신 |
| GET | `/api/auth/me` | 현재 사용자 정보 |

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices` | 장치 목록 조회 |
| POST | `/api/devices` | 장치 등록 |
| GET | `/api/devices/[id]` | 장치 상세 조회 |
| PATCH | `/api/devices/[id]` | 장치 수정 |
| DELETE | `/api/devices/[id]` | 장치 삭제 |
| POST | `/api/devices/[id]/wake` | WoL 매직 패킷 전송 |
| GET | `/api/devices/[id]/status` | 장치 상태 확인 |
| GET | `/api/devices/[id]/history` | WoL 전송 이력 |
| GET | `/api/devices/check-all` | 전체 장치 상태 확인 |

### Real-time
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sse/status` | SSE 상태 스트림 |

## License

This project is licensed under the [GNU General Public License v3.0](./LICENSE).
