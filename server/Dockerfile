FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN chmod +x node_modules/.bin/prisma

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "src/index.js"]
