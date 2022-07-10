#This is only needed if you're using helm to deploy into a Kubernetes cluster

#Fruit server
helm delete fruit-server
helm upgrade -i fruit-server bitnami/node --values=examples/Fruit-server/helm-values.yaml
