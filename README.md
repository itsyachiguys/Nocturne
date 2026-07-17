# 🌙 Nocturne

> A modern full-stack application built with scalability, security, and performance in mind.

---

## 📖 About the Project

Nocturne is a collaborative software project developed as part of our academic major project. The application is being built using modern web technologies and follows industry-standard software engineering practices.

The project is designed with a single backend architecture, allowing both the website and future mobile application to share the same database and APIs for seamless data synchronization.

---

## 👨‍💻 Team Members


| Name               |
| ------------------ |
| Yachi Gajjar       |
| Devashruti Sangadi |
| Yashri Parmar      |


## 🚀 Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- NestJS
- REST API

### Database

- PostgreSQL
- Prisma ORM

### Version Control

- Git
- GitHub

---

## 📂 Project Structure

```text
Nocturne/
│
├── frontend/
├── backend/
├── database/
├── docs/
├── assets/
└── README.md
```

---

## 🎯 Current Status

- [x] Repository Created
- [x] Team Collaboration Setup
- [x] Git Workflow Initialized
- [x] Project Structure Created
- [ ] Frontend Setup
- [ ] Backend Setup
- [ ] Database Integration
- [ ] Authentication System
- [ ] Dashboard Development
- [ ] Mobile Application

---

## 🌱 Git Workflow

```
main
│
└── develop
      ├── feature/login
      ├── feature/backend
      ├── feature/database
      └── feature/dashboard
```

---

## 📅 Last Updated

**26 June 2026**

Initial project setup completed.

# check your current branch

git branch 

# check status

git status 

# stage all changes

git add . 
or use : git add README.md 

# commit changes

git commit -m "nameofthecommit"

# push to current branch

git push iu origin feature/login   (only if first push to a new branch)
or use : git push 

# commit to main

# check your current branch 
git branch 

# check status 
git status 

# stage all changes 
git add . 
or use : git add README.md 

# commit changes 
git commit -m "nameofthecommit"

# push to current branch 
git push iu origin feature/login   (only if first push to a new branch)
or use : git push 

# commit to main 
git checkout main 
git pull origin main 
git add . 
git commit -m "updates"
git push origin main 

# create a new branch

# create a new branch 
git checkout main 
git pull origin main 
git checkout -b feature/newfeature 
git push -u origin feature/newfeature 

# create a feature branch from develop

# create a feature branch from develop 
git checkout develop 
git pull origin develop 
git checkout -b feature/login 
git push -u origin feature/login 

# commit to a feature branch

# commit to a feature branch 
(switch to the branch) git checkout feature/login 
then 
git add . 
git commit -m "commitname"
git push 

# pull latest changes from main

git checkout main 
git pull origin main 

# pull latest changes from develop

git checkout develop 
git pull origin develop 

# pull latest changes while on the branch

# pull latest changes from main 
git checkout main 
git pull origin main 

# pull latest changes from develop 
git checkout develop 
git pull origin develop 

# pull latest changes while on the branch 
(update develop first)
git checkout develop 
git pull origin develop 
(go back)
git checkout feature/login 
(merge lastest develop)
git merge develop

# fetch w/o updating files

git fetch origin 

# view commit history

# fetch w/o updating files 
git fetch origin 

# view commit history 
git log --oneline
(graph view)
git log --graph --oneline --decorate 

# see remote branches

git branch -r

# see all branches

git branch -a 

# switch branches

# see remote branches 
git branch -r

# see all branches 
git branch -a 

# switch branches 
git checkout develop 
or 
git checkout feature/login 

# delete local branch

# delete local branch 
git branch -d feature/login 
(force delete)
git branch -D feature/login 

# deleta a remote branch

git push origin --delete feature/login 
# deleta a remote branch 
git push origin --delete feature/login 

