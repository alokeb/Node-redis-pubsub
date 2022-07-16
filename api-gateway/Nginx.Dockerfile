FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf
USER nginx

#CMD ["nginx", "-g", "daemon off;"]