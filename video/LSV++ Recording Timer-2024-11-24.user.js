// ==UserScript==
// @name         LSV++ Recording Timer
// @namespace    http://liveswitch.com/
// @version      2024-11-24
// @description  Adds a timer next to REC when recording starts and resets on removal, persistent for dynamically updated pages.
// @author       Suyash Bansal
// @match        https://connect.video.liveswitch.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=liveswitch.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let timerInterval; // To store the interval ID
    let seconds = 0; // Timer seconds counter
    let currentElement; // Reference to the currently tracked element

    // Function to start the timer
    function startTimer(element) {
        // Stop any existing timer
        stopTimer();

        // Reset seconds
        seconds = 0;

        // Store reference to the current element
        currentElement = element;

        // Start the timer
        timerInterval = setInterval(() => {
            seconds++;
            updateText(currentElement, seconds);
        }, 1000);
    }

    // Function to stop the timer
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        currentElement = null;
    }

    // Function to update the text of the recording element
    function updateText(element, time) {
        const textElement = element.querySelector('.text');
        if (textElement) {
            textElement.textContent = `REC (${time}s)`;
        }
    }

    // Persistent observer for DOM changes
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            // Check for added nodes
            mutation.addedNodes.forEach((node) => {
                if (
                    node.nodeType === 1 && // Check if it's an element node
                    node.classList.contains('record-circle-container') &&
                    node.classList.contains('desktop-element')
                ) {
                    startTimer(node);
                }
            });

            // Check for removed nodes
            mutation.removedNodes.forEach((node) => {
                if (
                    node.nodeType === 1 && // Check if it's an element node
                    node.classList.contains('record-circle-container') &&
                    node.classList.contains('desktop-element')
                ) {
                    stopTimer();
                }
            });
        }
    });

    // Initialize the observer on the entire document
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Ensure the script re-checks elements on page load or navigation
    window.addEventListener('load', () => {
        const element = document.querySelector(
            '.record-circle-container.desktop-element'
        );
        if (element) {
            startTimer(element);
        }
    });
})();