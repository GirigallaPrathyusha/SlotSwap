FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
ENV VITE_API_URL=http://localhost:4000/api
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]


