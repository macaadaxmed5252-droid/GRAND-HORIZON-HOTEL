FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first so `npm install` only reruns (and its
# layer only rebuilds) when package.json/package-lock.json actually change,
# not on every source edit.
COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5173

# `--host` binds Vite to 0.0.0.0 instead of localhost, so the dev server is
# actually reachable from outside the container through the mapped port.
CMD ["npm", "run", "dev", "--", "--host"]
