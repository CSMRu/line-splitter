# GitHub Pages 배포 가이드

## 1단계: GitHub 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단 `+` 클릭 → `New repository` 선택
3. 저장소 설정:
   - Repository name: `line-splitter` (또는 원하는 이름)
   - Public 선택 (GitHub Pages는 무료 계정에서 Public 저장소만 지원)
   - `Create repository` 클릭

## 2단계: 로컬 프로젝트를 Git 저장소로 초기화

터미널에서 프로젝트 폴더로 이동 후 실행:

```bash
cd /Users/icsmr/Documents/Line-split
git init
git add .
git commit -m "Initial commit: Line Splitter app"
```

## 3단계: GitHub 저장소에 푸시

GitHub에서 제공하는 명령어 사용 (저장소 생성 후 표시됨):

```bash
git remote add origin https://github.com/YOUR_USERNAME/line-splitter.git
git branch -M main
git push -u origin main
```

> **참고**: `YOUR_USERNAME`을 실제 GitHub 사용자명으로 변경하세요.

## 4단계: GitHub Pages 활성화

1. GitHub 저장소 페이지에서 `Settings` 탭 클릭
2. 왼쪽 메뉴에서 `Pages` 클릭
3. **Source** 섹션에서:
   - Branch: `main` 선택
   - Folder: `/ (root)` 선택
4. `Save` 클릭

## 5단계: 배포 확인

- 몇 분 후 `https://YOUR_USERNAME.github.io/line-splitter/` 에서 접속 가능
- GitHub Pages 섹션에 배포 URL이 표시됩니다

## 추가 팁

### 커스텀 도메인 사용 (선택사항)
- Settings → Pages → Custom domain에서 설정 가능

### 업데이트 배포
프로젝트를 수정한 후:
```bash
git add .
git commit -m "Update: 변경 내용 설명"
git push
```

자동으로 GitHub Pages가 업데이트됩니다 (보통 1-2분 소요).

## 현재 프로젝트 파일 구조
```
Line-split/
├── index.html
├── style.css
└── app.js
```

모든 파일이 준비되어 있으므로 바로 배포 가능합니다!
