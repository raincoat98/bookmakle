document.addEventListener('DOMContentLoaded', function () {
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    const userInfo = document.getElementById('userInfo');
    let user = null;

    // Update UI based on user authentication state
    function updateUI(currentUser) {
        if (currentUser) {
            userInfo.textContent = `Signed in as: ${currentUser.email}`;
            signInButton.style.display = 'none';
            signOutButton.style.display = 'block';
            user = currentUser;
        } else {
            userInfo.textContent = 'Not signed in';
            signInButton.style.display = 'block';
            signOutButton.style.display = 'none';
            user = null;
        }
        console.log(currentUser);
    }

    // Fetch the user state from Chrome storage
    chrome.storage.local.get(['user'], function (result) {
        updateUI(result.user);
    });

    // Sign-in button click handler
    signInButton.addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'signIn' }, function (response) {
            if (response.user) {
                chrome.storage.local.set({ user: response.user });
                updateUI(response.user);
            }
        });
    });

    // Sign-out button click handler
    signOutButton.addEventListener('click', function () {
        logoutUser();
    });

    function logoutUser() {
        chrome.storage.local.remove('user', () => {
            console.log("User logged out.");
        });
        updateUI(null);
    }

});