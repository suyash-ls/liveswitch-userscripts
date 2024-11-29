// ==UserScript==
// @name         LSV++ Floating Window
// @namespace    http://liveswitch.com/
// @version      2024-11-27
// @description  Automatically enter Document Picture-in-Picture with live updates and video streams using the Media Session API.
// @author       Suyash Bansal
// @match        https://connect.video.liveswitch.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=liveswitch.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let pipWindow = null; // Reference to the Document PiP window
    let videoGrid = null; // Reference to the video grid container
    let observer = null;  // MutationObserver for live updates

    // Start Document PiP mode
    const startDocumentPiP = async () => {
        if (!videoGrid) {
            videoGrid = document.querySelector('.video-grid-container[type="screen"]');
        }

        if (videoGrid && !pipWindow) {
            try {
                pipWindow = await documentPictureInPicture.requestWindow({
                    width: 500,
                    height: 300,
                });

                pipWindow.document.body.innerHTML = ''; // Clear the PiP window
                const clonedContent = videoGrid.cloneNode(true); // Clone initial content
                pipWindow.document.body.appendChild(clonedContent);

                // Sync video streams
                syncVideoStreams(videoGrid, clonedContent);

                // Copy styles
                copyStylesToPiPWindow(pipWindow);

                // Observe changes for live updates
                observeLiveUpdates(videoGrid, pipWindow);

                console.log('Entered Document Picture-in-Picture mode.');
            } catch (error) {
                console.error('Failed to enter Document PiP mode:', error);
            }
        }
    };

    // Exit Document PiP mode
    const exitDocumentPiP = () => {
        if (pipWindow) {
            pipWindow.close(); // Close the PiP window
            pipWindow = null;
            console.log('Exited Document Picture-in-Picture mode.');
        }

        if (observer) {
            observer.disconnect(); // Stop observing changes
            observer = null;
        }
    };

    // Sync video streams between the main page and the PiP window
    const syncVideoStreams = (sourceElement, targetElement) => {
        const sourceVideos = sourceElement.querySelectorAll('video');
        const targetVideos = targetElement.querySelectorAll('video');

        sourceVideos.forEach((sourceVideo, index) => {
            const targetVideo = targetVideos[index];
            if (sourceVideo && targetVideo) {
                if (sourceVideo.srcObject) {
                    targetVideo.srcObject = sourceVideo.srcObject; // Transfer MediaStream
                } else {
                    targetVideo.src = sourceVideo.currentSrc; // Transfer static source
                }
                targetVideo.muted = true; // Prevent feedback loops
                targetVideo.play().catch((err) => {
                    console.error('Failed to play video in PiP window:', err);
                });
            }
        });
    };

    // Observe changes in the original video grid for live updates
    const observeLiveUpdates = (sourceElement, pipWindow) => {
        if (observer) observer.disconnect(); // Disconnect previous observer if any

        observer = new MutationObserver(() => {
            const clonedContent = sourceElement.cloneNode(true); // Clone updated content
            pipWindow.document.body.innerHTML = ''; // Clear PiP window content
            pipWindow.document.body.appendChild(clonedContent);

            // Sync video streams for updated content
            syncVideoStreams(sourceElement, clonedContent);
        });

        observer.observe(sourceElement, {
            childList: true,
            subtree: true,
            attributes: true,
        });

        console.log('Started observing live updates for the PiP window.');
    };

    // Copy styles to the Document PiP window
    const copyStylesToPiPWindow = (pipWindow) => {
        const styles = Array.from(document.styleSheets);

        styles.forEach((styleSheet) => {
            try {
                if (styleSheet.href) {
                    const link = pipWindow.document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = styleSheet.href;
                    pipWindow.document.head.appendChild(link);
                } else if (styleSheet.cssRules) {
                    const style = pipWindow.document.createElement('style');
                    Array.from(styleSheet.cssRules).forEach((rule) => {
                        style.appendChild(pipWindow.document.createTextNode(rule.cssText));
                    });
                    pipWindow.document.head.appendChild(style);
                }
            } catch (err) {
                console.warn('Failed to copy some styles:', err);
            }
        });
    };

    // Handle tab visibility changes
    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'hidden') {
            await startDocumentPiP(); // Enter PiP when the tab becomes hidden
        } else if (document.visibilityState === 'visible') {
            exitDocumentPiP(); // Exit PiP when the tab becomes visible
        }
    };

    // Safely register Media Session API handler
    const setupMediaSessionAction = () => {
        try {
            navigator.mediaSession.setActionHandler("enterpictureinpicture", async () => {
                console.log("Media session action triggered: enterpictureinpicture");
                await startDocumentPiP();
            });
        } catch (error) {
            console.log("The enterpictureinpicture action is not yet supported.");
        }
    };

    // Initialize the script
    const initialize = () => {
        console.log('Initializing Auto Document PiP script with live updates...');
        setupMediaSessionAction();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        console.log('Initialization complete.');
    };

    // Wait for the page to load before initializing
    window.addEventListener('load', initialize);
})();