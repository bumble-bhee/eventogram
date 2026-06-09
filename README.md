# Eventogram 🎉

Eventogram is a full-stack event and media management platform that allows users to [briefly explain what the app does, e.g., create events, share media, and manage attendees].

## 🚀 Features
* **User Authentication:** Secure login and registration.
* **Event Creation:** Users can easily create and manage events.
* **Media Sharing:** [Add a feature description here]
* **[Add another feature here]**

## 💻 Tech Stack
* **Frontend:** React.js
* **Backend:** Node.js, Express.js
* **Database:** [Mention your database, e.g., PostgreSQL or MongoDB] (using Prisma ORM)

## 🛠️ Getting Started
To get a local copy up and running, follow these steps.

### Prerequisites
* Node.js installed on your machine.

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/bumble-bhee/eventogram.git](https://github.com/bumble-bhee/eventogram.git)
   generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  PHOTOGRAPHER
  CLUB_MEMBER
  VIEWER
}

enum MediaType {
  PHOTO
  VIDEO
}

model User {
  id             Int              @id @default(autoincrement())
  name           String
  email          String           @unique
  username       String?          @unique
  password       String
  role           Role             @default(VIEWER)
  avatar         String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  // Relations
  eventsCreated  Event[]          @relation("EventCreator")
  mediaUploaded  Media[]          @relation("MediaUploader")
  likes          Like[]
  comments       Comment[]
  favourites     Favourite[]
  notifications  Notification[]   @relation("NotificationReceiver")
  triggered      Notification[]   @relation("NotificationTriggerer")
  faceDescriptor FaceDescriptor?
  taggedIn       MediaTag[]
}

model Event {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  category    String
  date        DateTime
  isPublic    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  createdBy   User      @relation("EventCreator", fields: [creatorId], references: [id])
  creatorId   Int
  media       Media[]
}

model Media {
  id           Int        @id @default(autoincrement())
  title        String?
  url          String     // S3 URL
  key          String     // S3 file key (for deletion)
  type         MediaType  @default(PHOTO)
  tags         String[]   // AI generated tags
  isPublic     Boolean    @default(true)
  size         Int?       // file size in bytes
 downloadCount Int @default(0)
  width        Int?
  height       Int?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  // Relations
  event        Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId      Int
  uploadedBy   User       @relation("MediaUploader", fields: [uploaderId], references: [id])
  uploaderId   Int
  likes        Like[]
  comments     Comment[]
  favourites   Favourite[]
  tags_users   MediaTag[]
  notifications Notification[]
}

model Like {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    Int
  media     Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  mediaId   Int

  @@unique([userId, mediaId])
}

model Comment {
  id        Int      @id @default(autoincrement())
  text      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    Int
  media     Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  mediaId   Int
}

model Favourite {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    Int
  media     Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  mediaId   Int

  @@unique([userId, mediaId])
}

model MediaTag {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())

  media     Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  mediaId   Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    Int

  @@unique([mediaId, userId])
}

model Notification {
  id          Int      @id @default(autoincrement())
  type        String
  message     String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())

  receiver    User     @relation("NotificationReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
  receiverId  Int
  triggerer   User     @relation("NotificationTriggerer", fields: [triggererId], references: [id], onDelete: Cascade)
  triggererId Int
  mediaId     Int?
  media       Media?   @relation(fields: [mediaId], references: [id], onDelete: SetNull)
}

model FaceDescriptor {
  id          Int      @id @default(autoincrement())
  descriptor  Float[]  // 128 numbers representing a face
  selfieUrl   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      Int      @unique
}

model MediaFaceData {
  id         Int      @id @default(autoincrement())
  mediaId    Int
  descriptor Float[]
  createdAt  DateTime @default(now())
}