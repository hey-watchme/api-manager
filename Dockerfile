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

# 古いビルド成果物を削除（キャッシュ対策）
RUN rm -rf dist/

# ビルド時の環境変数を設定（ビルド引数として受け取る）
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_KEY=${VITE_SUPABASE_KEY}

# 本番環境用ビルドを実行
ENV NODE_ENV=production
RUN npm run build

# ポート9001を公開
EXPOSE 9001

# Nginxイメージを使用してビルド済みファイルを配信
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 9001
CMD ["nginx", "-g", "daemon off;"]