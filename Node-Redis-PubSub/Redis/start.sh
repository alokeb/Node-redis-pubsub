#!/bin/sh

minikube start
kubectl create namespace redis
helm repo add dandydev https://dandydeveloper.github.io/charts
helm --namespace redis install redis dandydev/redis-ha
#kubectl apply -f haproxy.yaml