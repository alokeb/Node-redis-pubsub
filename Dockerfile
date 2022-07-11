FROM dtzar/helm-kubectl

RUN helm repo add bitnami https://charts.bitnami.com/bitnami

#Fruit-server
RUN helm upgrade -i fruit-server bitnami/node --values=examples/Fruit-server/helm-values.yaml --set mongodb.install=false
RUN export NODE_PORT=$(kubectl get --namespace default -o jsonpath="{.spec.ports[0].nodePort}" services fruit-server)
RUN export NODE_IP=$(kubectl get nodes --namespace default -o jsonpath="{.items[0].status.addresses[0].address}")
RUN echo "Fruit server URL: http://$NODE_IP:$NODE_PORT/"
