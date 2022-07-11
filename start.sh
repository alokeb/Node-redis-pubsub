#Install helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

#Install minikube and start it - This is assuming you're running a linux x64 system
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
minikube start

helm repo add bitnami https://charts.bitnami.com/bitnami

#Fruit-server
helm upgrade -i fruit-server bitnami/node --values=examples/Fruit-server/helm-values.yaml --set mongodb.install=false
export NODE_PORT=$(kubectl get --namespace default -o jsonpath="{.spec.ports[0].nodePort}" services fruit-server)
export NODE_IP=$(kubectl get nodes --namespace default -o jsonpath="{.items[0].status.addresses[0].address}")
echo "Fruit server URL: http://$NODE_IP:$NODE_PORT/"

#Month-server
helm upgrade -i month-server bitnami/node --values=examples/Month-server/helm-values.yaml --set mongodb.install=false
export NODE_PORT=$(kubectl get --namespace default -o jsonpath="{.spec.ports[0].nodePort}" services month-server)
export NODE_IP=$(kubectl get nodes --namespace default -o jsonpath="{.items[0].status.addresses[0].address}")
echo "Month server URL: http://$NODE_IP:$NODE_PORT/"