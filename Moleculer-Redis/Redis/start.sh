#!/bin/sh

#Start afresh and clear any danglers
minikube delete --all

minikube start
#Create namespace
kubectl create ns redis
kubectl config set-context --current --namespace=redis
#storageclass
kubectl apply -f sc.yaml
#persistent volume
kubectl apply -f pv.yaml
#ConfigMap
kubectl apply -n redis -f redis-config.yaml
#Deploy using StatefulSet
kubectl apply -n redis -f redis-statefulset.yaml
#Create headless service
kubectl apply -n redis -f redis-service.yaml