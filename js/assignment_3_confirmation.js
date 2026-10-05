const firstName =
    sessionStorage.getItem("firstName") || "";

const lastName =
    sessionStorage.getItem("lastName") || "";

const address =
    sessionStorage.getItem("address") || "";

const city =
    sessionStorage.getItem("city") || "";

const state =
    sessionStorage.getItem("state") || "";

const zip =
    sessionStorage.getItem("zip") || "";

const phone =
    sessionStorage.getItem("phone") || "";

const email =
    sessionStorage.getItem("email") || "";

const birthdate =
    sessionStorage.getItem("birthdate") || "";

const message =
    sessionStorage.getItem("message") || "";


/*
    Display the information.
*/

document.getElementById("confirmName").textContent =
    firstName + " " + lastName;


document.getElementById("confirmAddress").textContent =
    address +
    ", " +
    city +
    ", " +
    state +
    " " +
    zip;


document.getElementById("confirmPhone").textContent =
    phone;


document.getElementById("confirmEmail").textContent =
    email;


document.getElementById("confirmBirthdate").textContent =
    birthdate;


document.getElementById("confirmMessage").textContent =
    message;


/*
    Go back to the form.
*/

document
    .getElementById("backButton")
    .addEventListener("click", function () {

        window.history.back();

    });


/*
    Confirm and create the email.
*/

document
    .getElementById("confirmButton")
    .addEventListener("click", function () {

        const subject =
            "Assignment 3 Form Submission";


        const emailBody =
            "Name: " +
            firstName +
            " " +
            lastName +
            "\n\n" +

            "Address: " +
            address +
            "\n" +
            city +
            ", " +
            state +
            " " +
            zip +
            "\n\n" +

            "Phone: " +
            phone +
            "\n\n" +

            "Email: " +
            email +
            "\n\n" +

            "Birth Date: " +
            birthdate +
            "\n\n" +

            "Message:\n" +
            message;


        /*
            Change this to your actual email address.
        */

        const destinationEmail =
            "william_larson@daytonastate.edu";


        const mailtoLink =
            "mailto:" +
            destinationEmail +
            "?subject=" +
            encodeURIComponent(subject) +
            "&body=" +
            encodeURIComponent(emailBody);


        window.location.href = mailtoLink;

    });
