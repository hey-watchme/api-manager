# Node.js 20のAlpineイメージを使用（軽量）
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール（ビルドに必要なdevDependenciesも含む）
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# ビルドを実行
RUN npm run build

# ポート9001を公開
EXPOSE 9001

# Nginxイメージを使用してビルド済みファイルを配信
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 9001
CMD ["nginx", "-g", "daemon off;"]