#!/bin/sh

minikube stop
minikube start
#Create namespace
kubectl create ns redis
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