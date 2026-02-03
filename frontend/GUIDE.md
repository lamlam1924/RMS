node -v

docker build -t rms-fe .

docker run -p 5173:80 rms-fe

docker ps
docker stop <container_id>
docker rm <container_id>

