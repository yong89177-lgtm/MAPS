@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo  MAPS 서버 시작 준비 중...
echo ============================================

call npm config set strict-ssl false >nul 2>&1

echo 필요한 패키지를 확인/설치합니다 (몇 분 걸릴 수 있어요)...
call npm install
if errorlevel 1 (
  echo.
  echo [오류] 패키지 설치에 실패했습니다. 위에 나온 빨간 글씨를 캡처해서 문의해주세요.
  pause
  exit /b 1
)

if not exist .env (
  (
    echo ADMIN_PASSWORD=maps1234
    echo PORT=8081
  ) > .env
  echo.
  echo ================================================================
  echo  최초 실행이라 관리자 비밀번호를 기본값^(maps1234^)으로 설정했습니다.
  echo  로그인 후 꼭 비밀번호를 바꾸시거나, 지금 이 창을 닫고 이 폴더의
  echo  .env 파일을 메모장으로 열어 원하는 값으로 바꾼 뒤 다시 실행하세요.
  echo ================================================================
  echo.
  pause
)

echo.
echo MAPS 서버를 시작합니다. 이 창을 닫으면 서버가 꺼집니다.
echo.
call npm start

pause
