const $ = window.$;
$(document).ready(function() {

    // Function that formats the date to: "MMM D, h:mm a"
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true
        };
        return date.toLocaleDateString('en-US', options);
    }

    // The current user's id
    const userId = $('.stats').data('user-id');

    // Gets the current user: currentUserObject
    $.ajax({
        url: `http://localhost:5001/api/v1/users/${userId}`,
        method: "GET",
        dataType: "json",
        success: function(res) {
            currentUserObject = res;
        }
    });

    // Profile Card section ************************************************

    // The number of posts
    $.ajax({
        url: `http://localhost:5001/api/v1/users/${userId}/posts`,
        type: 'GET',
        success: function (response) {
            let totalPosts = 0;
            response.forEach(function (post) {
                totalPosts++;
            });
            $('#posts-count').append(totalPosts);
        }
    });

    //The number of followers
    $.ajax({
        url: `http://localhost:5001/api/v1/users/${userId}/followers`,
        type: 'GET',
        success: function (response) {
            let totalFollowers = 0;
            response.forEach(function (post) {
                totalFollowers++;
            });
            $('#followers-count').append(totalFollowers);
        }
    });

    // The number of following
    $.ajax({
        url: `http://localhost:5001/api/v1/users/${userId}/following`,
        type: 'GET',
        success: function (response) {
            let totalFollowing = 0;
            response.forEach(function (post) {
                totalFollowing++;
            });
            $('#following-count').append(totalFollowing);
        }
    });

    // Scroll Nav section
    $(window).on('scroll', function() {
        const scrollNavHTML = `
            <div class="scroll-nav">
                    <a href="#">
                        <img class="nav-icon" src="../static/images/home-icon.png" alt="Feed Icon">
                        <h2>Home</h2>
                    </a>

                    <a href="${profileUrl}">
                        <img class="nav-icon" id="profile-icon" src="../static/images/profile-icon.png" alt="Profile Icon">
                        <h2>Profile</h2>
                    </a>

                    <a href="#">
                        <img class="nav-icon" id="message-icon" src="../static/images/message-icon.png" alt="Messages Icon">
                        <h2>Messages</h2>
                    </a>

                    <a href="#">
                        <img class="nav-icon" id="logout-icon" src="../static/images/logout-icon.png" alt="Logout Icon">
                        <h2>Logout</h2>
                    </a>
                </div>
        `;

        if ($(window).scrollTop() > 100) {
            if ($('.scroll-nav').length === 0) { // Only append if not already present
                $('.profile-card').append(scrollNavHTML);
            }
        } else {
            if ($('.scroll-nav').length > 0) { // Only remove if present
                $('.scroll-nav').remove();
            }
        }
    });


    // Feed Section **********************************************************

    // Create Post
    $('.post-form button').on('click', function(event) {
        event.preventDefault();

        const content = $('textarea[name="content"]').val();
        const userId = $('.post-form').data('user-id');
        const photo = $('#file-upload')[0].files[0];

        if (!content.trim()) {
            $('.error-message').text('Did you forget to write something?').show().delay(3000).fadeOut();
            return;
        }

        const formData = new FormData();
        formData.append('content', content);

        if (photo) {
            formData.append('photo', photo);
        }

        console.log('Sending data:', formData);

        $.ajax({
            url: `http://localhost:5001/api/v1/users/${userId}/posts`,
            type: 'POST',
            processData: false,
            contentType: false,
            data: formData,
            success: function(postResponse) {
                console.log('Post created successfully!', postResponse);
                
                // Base Attributes for the Like button
                thumbsup = "../static/images/thumbsup-symbol.png";
                likeClass = "likes";
                likeId = "";
                textId = "like";

                // Extract user_id from response
                const postUserId = postResponse.user_id;

                // Fetch the user with the id to get their info
                $.ajax({
                    url: `http://localhost:5001/api/v1/users/${postUserId}`,
                    type: 'GET',
                    success: function(userResponse) {
                        const formattedDate = formatDate(postResponse.created_at);

                        // Create a new post element
                        const newPost = `
                            <article class="post" data-id="${postResponse.id}">
                                <header>
                                    <img src="../static/images/4.jpg" alt="User Avatar">
                                    <div class="user-info">
                                        <h3>${userResponse.name}</h3>
                                        <h5>${formattedDate}</h5>
                                    </div>
                                </header>
                                <p class="text-content">${postResponse.content}</p>
                                ${postResponse.picture ? `<div class="post-photo"><img src="${postResponse.picture}" alt="Post Image"></div>` : ''}
                                <div class="post-buttons">
                                    <div class="${likeClass}" id="like-group">
                                        <img class="thumbsup-symbol" src="${thumbsup}" id="${likeId}">
                                        <h5 id="${textId}">Like</h5>
                                    </div>
                                    <div class="comment-group">
                                        <img class="comment-symbol" src="../static/images/comment-symbol.png">
                                        <h5 id="comment">Comment</h5>
                                    </div>
                                </div>
                            </article>
                        `;

                        // Prepend the new post to the feed
                        $('.feed').children().first().after(newPost);

                        // Clear the textarea and the uploaded image
                        $('textarea[name="content"]').val('');
                        $('.image-preview').html('');
                    },
                    error: function(xhr, status, error) {
                        console.error('Failed to fetch user details.', xhr.responseText);
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Failed to create post.', xhr.responseText);
            }
        });
    });

    // Changes Color of Post form when textarea is selected or typing
    $('.post-form').on('click', function() {
        $(this).addClass('typing');
    
        // Handle click events outside the form
        $(document).on('click', function(event) {
            if (!$(event.target).is('.post-form, .post-form *')) {
                // Remove 'typing' class if clicked outside the form
                $('.post-form').removeClass('typing');
            }
        });
    });

    // Show the button when the user writes something
    $('textarea[name="content"]').on('input', function() {
        const content = $(this).val().trim();
    
        if (content.length > 0) {
            $('.post-button').fadeIn();
        } else {
            $('.post-button').fadeOut();
        }
    });

    // Handle file upload and preview
    $('#file-upload').on('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Display the uploaded image in the preview section
                $('.image-preview').html(`<img src="${e.target.result}" alt="Image Preview">`);
            };
            reader.readAsDataURL(file);
        } else {
            // Clear the preview if no file is selected
            $('.image-preview').html('');
        }
    });


    // Populate the feed with posts from followed users
    $.ajax({
        url: `http://localhost:5001/api/v1/users/${userId}/following/posts`,
        type: 'GET',
        success: function(postsResponse) {
            let postsHTML = '';
            postsResponse.forEach(function(post) {

                // Check if the current user likes this post so we can update the thumbs up img
                if (currentUserObject.liked_posts.includes(post.id)) {
                    thumbsup = "../static/images/blue-like-button-icon.png";
                    likeClass = "unlike";
                    likeId = "blue-like";
                    textId = "liked"
                } else {
                    thumbsup = "../static/images/thumbsup-symbol.png";
                    likeClass = "likes";
                    likeId = "";
                    textId = "like";
                }

                // Display the likes counter based on the number of likes
                let likeText = '';
                if (post.likes_no > 0) {
                    likeText = post.likes_no === 1 ? '1 Like' : `${post.likes_no} Likes`;
                }

                postsHTML += `
                    <article class="post" data-id="${post.id}">
                        <header>
                            <img src="../static/images/4.jpg" alt="User Avatar">
                            <div class="user-info">
                                <h3>${post.user_name}</h3>
                                <h5>${formatDate(post.created_at)}</h5>
                            </div>
                        </header>
                        <p class="text-content">${post.content}</p>
                        ${post.picture ? `<div class="post-photo"><img src="${post.picture}" alt="Post Image"></div>` : ''}
                        ${post.likes_no > 0 ? `
                            <div class="likes-counter">
                                <img class="like-symbol" src="../static/images/like_symbol.png">
                                <span>${likeText}</span>
                            </div>
                        ` : ''}
                        <div class="post-buttons">
                            <div class="${likeClass}" id="like-group">
                                <img class="thumbsup-symbol" src="${thumbsup}" id="${likeId}">
                                <h5 id="${textId}">Like</h5>
                            </div>
                            <div class="comment-group">
                                <img class="comment-symbol" src="../static/images/comment-symbol.png">
                                <h5 id="comment">Comment</h5>
                            </div>
                        </div>
                    </article>
                `;
            });

            // Append posts to the feed
            $('.feed').append(postsHTML);
        },
        error: function(xhr, status, error) {
            console.error('Failed to fetch posts:', xhr.responseText);
        }
    });

    // Like Button
    $('.feed').on('click', '.likes', function() {
        const postItem = $(this).closest('.post');
        const postId = postItem.data('id');
        const requestData = {
            user_id: userId,
            post_id: postId
        };

        $.ajax({
            url: "http://localhost:5001/api/v1/likes",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(requestData),
            success: function(res) {
                const likeCounter = postItem.find('.likes-counter span');
                const counterText = res.like_no === 1 ? '1 Like' : `${res.like_no} Likes`;

                // Check if .likes-counter exists, and handle accordingly
                // If the counter is at 0, when liking for the first time, add the counter section
                if (postItem.find('.likes-counter').length === 0) {
                    postItem.find('.post-buttons').before(`
                        <div class="likes-counter">
                            <img class="like-symbol" src="../static/images/like_symbol.png">
                            <span>${counterText}</span>
                        </div>
                    `);
                } else {
                    likeCounter.html(counterText);
                }
                
                // Change like text to blue
                const likeText = postItem.find('.likes h5');
                likeText.text('Liked').attr('id', 'liked');

                const likeImage = postItem.find('.likes img');

                // Remove the element, update its attributes, and reinsert it
                likeImage.remove(); // Remove the img element
                
                postItem.find('.likes').prepend(`
                    <img class="new-class thumbsup-symbol" src="../static/images/blue-like-button-icon.png" id="blue-like">
                `);

                // Force redraw
                const newLikeImage = postItem.find('.thumbsup-symbol');
                newLikeImage.hide().show(0);

                postItem.find('.likes').addClass('unlike').removeClass('likes');
            }
        });
    });

    // Unlike Button
    $('.feed').on('click', '.unlike', function() {
        const postItem = $(this).closest('.post');
        const postId = postItem.data('id');

        $.ajax({
            url: `http://localhost:5001/api/v1/likes/${postId}/${userId}`,
            method: "DELETE",
            dataType: "json",
            success: function(res) {
                const likeCounter = postItem.find('.likes-counter span');
                const counterText = res.like_no === 0 ? '' : (res.like_no === 1 ? '1 Like' : `${res.like_no} Likes`);

                // Check if .likes-counter exists and update or remove it
                if (res.like_no === 0) {
                    postItem.find('.likes-counter').remove();
                } else {
                    likeCounter.html(counterText);
                }

                // Change like text to grey
                const likeText = postItem.find('.unlike h5');
                likeText.text('Like').attr('id', 'like');

                const likeImage = postItem.find('.unlike img');

                // Remove the element, update its attributes, and reinsert it
                likeImage.remove(); // Remove the img element
                postItem.find('.unlike').prepend(`
                    <img class="newClass thumbsup-symbol" src="../static/images/thumbsup-symbol.png" id="">
                `);

                // Force redraw
                const newLikeImage = postItem.find('#blue-like');
                newLikeImage.hide().show(0);

                postItem.find('.unlike').addClass('likes').removeClass('unlike');
                }
        });
    });


    // Suggestions section ***************************************************

    // Display Suggested users to follow
    $.ajax({
        url: 'http://localhost:5001/api/v1/users',
        method: 'GET',
        success: function(allUsers) {
            // Fetch users the current user follows
            $.ajax({
                url: `http://localhost:5001/api/v1/users/${userId}/following`,
                method: 'GET',
                success: function(followingUsers) {
                    // Create suggestions array
                    const suggestions = [];
    
                    for (let i = 0; i < allUsers.length; i++) {
                        let userIsFollowing = false;
    
                        // Check if current user is in the following list
                        for (let j = 0; j < followingUsers.length; j++) {
                            if (allUsers[i].id === followingUsers[j].id) {
                                userIsFollowing = true;
                                break;
                            }
                        }
    
                        // If the user isn't followed, add it to suggestions
                        if (!userIsFollowing) {
                            suggestions.push(allUsers[i]);
                        }
                    }
    
                    // Display suggestions
                    const suggestionsList = $('.suggestions ul');
                    suggestionsList.empty();
                    for (let i = 0; i < suggestions.length; i++) {
                        const user = suggestions[i];
                        suggestionsList.append(`
                            <li>
                                <img src="../static/images/2.jpg">
                                <span>${user.name} <h5>1 Mutual Friend</h5> </span>
                                <button class="follow-button" data-user-id="${user.id}">Follow</button>
                            </li>
                        `);
                    }
                }
            });
        }
    });


    // Follow Button
    $(document).on('click', '.follow-button', function() {
        const followButton = $(this);
        const followUserId = $(this).data('user-id');
        $.ajax({
            url: `http://localhost:5001/api/v1/users/${userId}/follow/${followUserId}`,
            method: 'POST',
            success: function() {
                // Update the button after following the user
                followButton.removeClass('follow-button').addClass('unfollow-button').text('Following')
    
                $.ajax({
                    url: `http://localhost:5001/api/v1/users/${userId}/following`,
                    type: 'GET',
                    success: function (response) {
                        let totalFollowing= 0;
                        response.forEach(function (post) {
                            totalFollowing++;
                        });
                        $('#following-count').text(`Following: ${totalFollowing}`);
                    }
                });
            },
        });
    });

    // Unfollow Button
    $(document).on('click', '.unfollow-button', function() {
        const unfollowButton = $(this);
        const unfollowUserId = unfollowButton.data('user-id');
    
        $.ajax({
            url: `http://localhost:5001/api/v1/users/${userId}/unfollow/${unfollowUserId}`,
            method: 'POST',
            success: function() {
                // Change button back to "Follow"
                unfollowButton.removeClass('unfollow-button').addClass('follow-button').text('Follow');

                // Update followers count
                $.ajax({
                    url: `http://localhost:5001/api/v1/users/${userId}/following`,
                    type: 'GET',
                    success: function (response) {
                        let totalFollowing = 0;
                        response.forEach(function (post) {
                            totalFollowing++;
                        });
                        $('#following-count').text(`Following: ${totalFollowing}`);
                    }
                });
            }
        });
    });

});
