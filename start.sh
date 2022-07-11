#Pre-requisite: Docker must be running and available

#Install helm - uncomment if you don't have helm installed
#curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

#Install minikube and start it - if you don't already have a k8s cluster running visit https://minikube.sigs.k8s.io/docs/start/
#minikube start

#kubectl create namespace node-redis-pubsub

#helm repo add bitnami https://charts.bitnami.com/bitnami

#Fruit-server
helm upgrade -i --namespace=node-redis-pubsub fruit-server bitnami/node --values=examples/Fruit-server/helm-values.yaml --set mongodb.install=false
export NODE_PORT=$(kubectl get --namespace default -o jsonpath="{.spec.ports[0].nodePort}" services fruit-server)
export NODE_IP=$(kubectl get nodes --namespace default -o jsonpath="{.items[0].status.addresses[0].address}")
echo "Fruit server URL: http://$NODE_IP:$NODE_PORT/"

#Month-server
helm upgrade -i --namespace=node-redis-pubsub month-server bitnami/node --values=examples/Month-server/helm-values.yaml --set mongodb.install=false
export NODE_PORT=$(kubectl get --namespace default -o jsonpath="{.spec.ports[0].nodePort}" services month-server)
export NODE_IP=$(kubectl get nodes --namespace default -o jsonpath="{.items[0].status.addresses[0].address}")
echo "Month server URL: http://$NODE_IP:$NODE_PORT/"

#Kong API Gateway
kubectl create namespace kong

#Redis
helm upgrade -i --namespace=node-redis-pubsub redis-cluster bitnami/redis --values=Redis/helm-values.yaml
export NODE_IP=$(kubectl get nodes --namespace node-redis-pubsub -o jsonpath="{.items[0].status.addresses[0].address}")
export NODE_PORT=$(kubectl get --namespace node-redis-pubsub -o jsonpath="{.spec.ports[0].nodePort}" services redis-cluster-master)
echo "To connect to redis use redis-cli -h $NODE_IP -p $NODE_PORT"


#HAProxy
helm upgrade -i --namespace=node-redis-pubsub redis-haproxy bitnami/haproxy  --values=Redis/haproxy-helm-values.yaml