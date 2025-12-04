# **Project Overview**

## **Application Vision/Goal:**
This application will enable users to find, save, and plan meals easily. It will help users organize their meals for the week, generate grocery lists, and share recipes with friends or family.We will probably have 2 kinds of application experiences, one for students who are trying to map out a plan for the week, and one for people who are trying to find new recipes to try out and cook for themselves, mainly people off campus.

## **Scope:**
It needs to be able to allow the user to create an account or sign in. Allow the user to search for recipes or browse through them in a grid. Users should be able to save recipes that they found, and they can add their own so that they are able to create a weekly meal plan. We can have summaries of each days meals with nutrition facts. At the end of the week you can get an email based on your meals. The user should be able to generate a grocery list based on the meals they have planned for the week. The user should be able to share recipes with other users. 

## **Deliverables:**
[List what will be delivered by the end of the project, such as a working MVP (Minimum Viable Product), specific features, documentation, etc.]
By the end of the projcet we will have a functioning app that will prompt users to create an account, choose what kind of user they are, and then go from there. The main features like meal tracking and finding recipes via API should be done farily quickly so not a concern. Entire process will be documented.

## **Success Criteria:**
meet every week. make sure we discuss what we did, what we plan to do and when we plan to do it. Help eachother figure out bugs and problems. Stay on top of the weekly sprint schedules.
## **Assumptions:**
[List any assumptions about the technology, users, or resources that could impact development.]
Assumptions for users include them either using it for personal use or school-based use. We aren't catering to business use. We are using free API's so we are assuming they will stay free.

## **Risks:**
[Identify potential risks and challenges, such as technical limitations, resource constraints, or dependency issues.]
We are using technolgoies that some of us aren't fluent in so if we need help we can't rely on eachother and might need to pursue external options.

## **Design / Architectural Review:**
[Outline the initial thoughts on application architecture. Will it be monolithic or microservices? Will it use a database? What major components will be included?]
We will definitely have our project model a monolithic application architecture. The goal right now is to build just enough features to deliver value, test the idea, and gather feedback before implementing even more advanced functionality. For our meal planning app, the MVP would include essentials like user accounts for sign-up and sign-in, recipe search through a third-party API, the ability to save favorite recipes, creating a basic weekly meal plan, and generating a grocery list from that plan. The major components of the system will therefore consist of a frontend (React) for the user interface, a backend (Node.js/Express) to handle API requests and business logic, integration with an external recipe API, and the PostgreSQL database for persistent storage.

## **Test Environment:**
[Define how the application will be tested. Will you use automated tests? What environment will the tests run in?]
We will test the application using a mix of automated and manual testing. Automated tests will check that both the frontend and backend work as expected, while manual testing will be used to make sure the user experience feels smooth. The tests will run in a local development environment with Docker and within our own cloned repos as well.

---

# **Team Setup**

## **Team Members:**
[List all team members involved in the project.]
Johnny Lu
Muhammad Chaundry
Alvin Thomas

## **Team Roles:**
[Define roles for each team member, such as developer, designer, project manager, QA tester, etc.]
Our team roles are to be determined as of right now.

## **Team Norms:**
[Establish how the team will communicate, how often meetings will happen, and any other ground rules for collaboration.]
The team will communicate through our Messages Groupchat and Discord. Meetings will occur 1-2 times a week with summaries following each meeting so we know exactly what occured. At the end of each week, we will give each other yet another update on what we have all done and if anything else was achieved beyond the scope of our meetings. 

## **Application Stack:**
[List all the technologies being used in the project, including programming languages, frameworks, and tools.]
As of right now we will be using React on the frontend to provide the user interface, with Node.js and Express.js powering the backend to handle API requests and business logic. We will use a PostgreSQL database to store user accounts, saved recipes, and meal plans, while authentication will be managed through a third-party service to simplify account creation and login. Recipe data will come from an external API, which will be integrated into the backend to supply recipe details and nutrition information to the frontend. For development and deployment, we will rely on Docker and Docker Compose to containerize the frontend, backend, and database, ensuring consistent environments across all team members’ machines. Javascript and SQL are programming languages we will be using.

### **Libraries/Frameworks:**
[List any specific libraries or frameworks your application will use, such as React, Flask, Django, etc.]
We will use React to build the user interface on the frontend and Node.js with Express.js to handle the backend. Our data will be stored in a PostgreSQL database, and we will connect to a third-party authentication service for user accounts as well as a third-party recipe API for recipe information.