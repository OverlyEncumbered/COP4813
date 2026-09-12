const form = document.getElementById("contactForm");
const phone = document.getElementById("phone");
const birthdate = document.getElementById("birthdate");
const confirmAnswer = document.getElementById("confirm");
const errorMessage = document.getElementById("errorMessage");


/*
    Phone number input mask.
    Converts 3865551234 into:

    (386)555-1234
*/

phone.addEventListener("input", function () {

    let numbers = phone.value.replace(/\D/g, "");

    numbers = numbers.slice(0, 10);


    if (numbers.length > 6) {

        phone.value =
            "(" +
            numbers.slice(0, 3) +
            ")" +
            numbers.slice(3, 6) +
            "-" +
            numbers.slice(6);

    }

    else if (numbers.length > 3) {

        phone.value =
            "(" +
            numbers.slice(0, 3) +
            ")" +
            numbers.slice(3);

    }

    else {

        phone.value = numbers;

    }

});


form.addEventListener("submit", function (event) {

    event.preventDefault();

    errorMessage.textContent = "";


    /*
        Validate phone number.
    */

    const phoneNumbers = phone.value.replace(/\D/g, "");

    if (phoneNumbers.length !== 10) {

        errorMessage.textContent =
            "Please enter a complete 10-digit phone number.";

        phone.focus();

        return;

    }


    /*
        Validate birth date.
    */

    const enteredBirthdate = new Date(
        birthdate.value + "T00:00:00"
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);


    if (enteredBirthdate > today) {

        errorMessage.textContent =
            "Birth date cannot be in the future.";

        birthdate.focus();

        return;

    }


    /*
        Validate security question.
    */

    if (Number(confirmAnswer.value) !== 8) {

        errorMessage.textContent =
            "The security question answer is incorrect.";

        confirmAnswer.focus();

        return;

    }


    /*
        Save information in sessionStorage.
        This allows the confirmation page to
        display the information entered.
    */

    sessionStorage.setItem(
        "firstName",
        document.getElementById("firstName").value
    );

    sessionStorage.setItem(
        "lastName",
        document.getElementById("lastName").value
    );

    sessionStorage.setItem(
        "address",
        document.getElementById("address").value
    );

    sessionStorage.setItem(
        "city",
        document.getElementById("city").value
    );

    sessionStorage.setItem(
        "state",
        document.getElementById("state").value
    );

    sessionStorage.setItem(
        "zip",
        document.getElementById("zip").value
    );

    sessionStorage.setItem(
        "phone",
        phone.value
    );

    sessionStorage.setItem(
        "email",
        document.getElementById("email").value
    );

    sessionStorage.setItem(
        "birthdate",
        birthdate.value
    );

    sessionStorage.setItem(
        "message",
        document.getElementById("message").value
    );


    /*
        Move to confirmation page.
    */

    window.location.href = "confirmation.html";

});
