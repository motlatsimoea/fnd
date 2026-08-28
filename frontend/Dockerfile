# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Accept variables from Docker build
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ARG REACT_APP_GOOGLE_MAPS_API_KEY

# Make them available to npm run build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_GOOGLE_MAPS_API_KEY=$REACT_APP_GOOGLE_MAPS_API_KEY


# Install dependencies
COPY package*.json ./

RUN npm ci

# Copy frontend source
COPY . .

# Debug
RUN echo "REACT_APP_API_URL=$REACT_APP_API_URL"
RUN echo "REACT_APP_WS_URL=$REACT_APP_WS_URL"

# Build React application
RUN npm run build


# Production stage
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]