FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN echo "Checking bcryptjs installation:" && npm list bcryptjs || echo "bcryptjs not installed"

COPY . .

CMD ["npm", "start"]