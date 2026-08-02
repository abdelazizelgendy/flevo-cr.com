FROM nginx:alpine

# Copy all site files into web root
COPY . /usr/share/nginx/html

# Place nginx config template (PORT is injected by Railway at runtime)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Remove server-side files from web root so they aren't publicly served
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/nginx.conf.template \
          /usr/share/nginx/html/railway.toml \
          /usr/share/nginx/html/.dockerignore

EXPOSE 8080
