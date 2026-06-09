# Eventogram 🎉

Eventogram is a full-stack event and media management platform that allows users to create events, share media, and manage attendees.

## 🚀 Features
* **User Authentication:** Secure login and registration.
* **Event Creation:** Users can easily create and manage events.
* **Media Sharing:** Upload, tag, and organize event photos and videos.
* **AI Facial Recognition:** Easily find yourself in event galleries.

## 💻 Tech Stack
* **Frontend:** React.js
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (using Prisma ORM)

## 🛠️ Getting Started
To get a local copy up and running, follow these steps.

### Prerequisites
* Node.js installed on your machine.

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/bumble-bhee/eventogram.git](https://github.com/bumble-bhee/eventogram.git)
   ```
2. Install dependencies for both frontend and backend:
   ```bash
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

## 🗄️ Database Schema

```mermaid
erDiagram
    USER ||--o{ EVENT : "creates"
    USER ||--o{ MEDIA : "uploads"
    USER ||--o{ LIKE : "gives"
    USER ||--o{ COMMENT : "writes"
    USER ||--o{ FAVOURITE : "adds"
    USER ||--o{ NOTIFICATION : "receives/triggers"
    USER ||--|| FACEDESCRIPTOR : "has"
    USER ||--o{ MEDIATAG : "tagged in"
    
    EVENT ||--o{ MEDIA : "contains"
    
    MEDIA ||--o{ LIKE : "receives"
    MEDIA ||--o{ COMMENT : "receives"
    MEDIA ||--o{ FAVOURITE : "receives"
    MEDIA ||--o{ MEDIATAG : "contains"
    MEDIA ||--o{ MEDIAFACEDATA : "contains faces"

    USER {
        Int id PK
        String name
        String email
        Role role
    }
    EVENT {
        Int id PK
        String title
        String category
        DateTime date
    }
    MEDIA {
        Int id PK
        String url
        MediaType type
        Int eventId FK
        Int uploaderId FK
    }
    LIKE {
        Int id PK
        Int userId FK
        Int mediaId FK
    }
    COMMENT {
        Int id PK
        String text
        Int userId FK
        Int mediaId FK
    }
    FACEDESCRIPTOR {
        Int id PK
        Float[] descriptor
        Int userId FK
    }
## 🏗️ System Architecture

```mermaid
flowchart LR
    subgraph Client Side
        UI[React.js Frontend]
    end

    subgraph Server Side
        API[Node.js & Express Backend]
        ORM[Prisma ORM]
    end

    subgraph Data & Storage
        DB[(PostgreSQL Database)]
        S3[(Cloud Storage / S3)]
    end

    UI <-->|HTTP Requests| API
    API <-->|Prisma Queries| ORM
    ORM <-->|Read / Write| DB
    API <-->|Upload / Fetch Media| S3