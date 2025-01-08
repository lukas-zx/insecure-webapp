FROM ubuntu:16.04
RUN apt-get update && apt-get install -y \
  curl \
  wget \
  nano \
  build-essential \
  python \
  && curl -sL https://deb.nodesource.com/setup_14.x | bash - \
  && apt-get install -y nodejs \
  && apt-get clean

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
