// Get the canvas element by its ID
const canvas = document.getElementById('canvas1');

// focal length
let f = 100;

// Check if the canvas is supported
if (canvas.getContext) {
    // Get the 2D drawing context
    const ctx = canvas.getContext('2d');

    // get the light ray checkbox
    const getRay = document.getElementById('ray');
    getRay.disabled = false;
    getRay.checked = false;
    getRay.onclick = function() {
        draw();
    }

    // get the slider
    const slider = document.getElementById('slider');
    slider.disabled = false;
    // update constantly if the slider is being dragged and we are not doing light ray animation
    slider.oninput = function() {
        if(getRay.checked) {
            return;
        }
        draw();
    }
    // update only when slider is finished changing if we are doing light ray animation
    slider.onchange = function() {
        if(getRay.checked) {
            draw();
        }
    }

    // get the o = f checkbox
    const oToF = document.getElementById('oToF');
    // get the o = 2f checkbox
    const oTo2F = document.getElementById('oTo2F');

    // set o = f rules
    oToF.disabled = false;
    oToF.checked = false;
    oToF.onclick = function() {
        if(oToF.checked) {
            slider.value = -f;
            slider.disabled = true;
            oTo2F.disabled = true;
            
        } else {
            slider.disabled = false;
            oTo2F.disabled = false;
        }
        draw();
    }

    // set o = 2f rules
    oTo2F.disabled = false;
    oTo2F.checked = false;
    oTo2F.onclick = function() {
        if(oTo2F.checked) {
            slider.value = -2*f;
            slider.disabled = true;
            oToF.disabled = true;
        } else {
            slider.disabled = false;
            oToF.disabled = false;
        }
        draw();
    }

    // get distance of object (The o value is always positive and the slider uses negative values, so must negate)
    let o = -Number(slider.value);
    let i;

    // Create an SVG image element (learned how to do this with GitHub Copilot)
    const img = new Image();
    img.src = '1.svg';
    img.onload = function() {
        draw();
    };

    function draw() {
        // clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set the fill style
        ctx.fillStyle = 'black';

        // create the state of the SVG image
        ctx.save();

        // make the origin at the center of the lens
        ctx.translate(canvas.width/2, canvas.height/2);
        // flip the y-axis
        ctx.scale(1,-1);

        // scale the canvas to fit the image
        ctx.scale(canvas.width / img.width, canvas.height / img.height);

        // Calculate the coordinates to center the image
        const x = -img.width / 2;
        const y = -img.height / 2;

        // Draw the SVG image onto the canvas
        ctx.drawImage(img, x, y);

        // restore the state of the canvas
        ctx.restore();

        // draw the text over the image
        drawText();

        // create the state of the movable objects
        ctx.save();

        // make the origin at the center of the lens
        ctx.translate(canvas.width/2, canvas.height/2);
        // flip the y-axis
        ctx.scale(1,-1);
        
        // draw focal points and 2f points
        focalPoints();
        twiceFocal();

        // draw the object
        object();

        // get the image distance
        imageDistance();

        // draw the light ray, if the checkbox is checked
        if(getRay.checked) {
            lightRay(0.01);
            return;
        }

        // draw the image
        image();
        
        // restore the state of the canvas
        ctx.restore();

    }

    /* Draws the informative text on the canvas
    *
    */
    function drawText() {
        ctx.save();
            // Set the rectangle properties
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';

            // draw rectangle where text will be
            ctx.fillRect(5, canvas.height - 80, canvas.width *8.3/12, 70);
            ctx.strokeRect(5, canvas.height - 80, canvas.width *8.3/12, 70);

            // Set the font properties
            ctx.font = '20px Garamond';
            ctx.fillStyle = 'black';

            // Draw the text on the canvas
            ctx.fillText('Object: Red Arrow', 15, canvas.height - 25);
            ctx.fillText('Image: Blue Arrow', 15, canvas.height - 50);

            ctx.fillText('Focal Points: Black Dots', 215, canvas.height - 25);
            ctx.fillText('2F Points: Green Dots', 215, canvas.height - 50);
        ctx.restore();
    }

    /* Draws the light ray
    *
    * @param {Number} percentage - the percentage of the way the light ray is drawn
    */
    function lightRay(percentage) {
        // do not draw the light ray if the image is far away
        if(i != undefined && Math.abs(i) > canvas.width/2) {
            // create message that the image is too far away to draw
            ctx.save();
                ctx.scale(1, -1);

                ctx.fillStyle = 'white';
                ctx.fillRect(-285, -270, 580, 40);
                ctx.strokeRect(-285, -270, 580, 40);

                ctx.fillStyle = 'red';
                ctx.font = '30px Garamond'; 
                ctx.fillText('The image is too far away to draw the light rays.', -275, -240);
            ctx.restore();

            // restore the save in draw that is unreachable due to returning
            ctx.restore();
            return;
        }

        // make the checkbox uncheckable
        getRay.disabled = true;
        // make the slider unmovable
        slider.disabled = true;

        ctx.save();

        ctx.strokeStyle = 'rgb(255, 204, 0)';
        ctx.lineWidth = 5;

        // get the image magnification
        let s = magnification();

        // the image is at infinity
        if(i === undefined) {

            // get the object, focal point, and lens center locations
            let objTip = [-o, 100];
            let focalPt = [f, 0];
            let lensCenter = [0, 0];

            // draw the rays
            rayThroughLensCenter(objTip, lensCenter, percentage, false, null);
            rayParallelToFocal(objTip, focalPt, percentage, false, null);

            // **************************** REPEAT DRAWING AS NEEDED **************************
            // draw the line until it reaches somewhere past the image tip
            if (percentage < 4) {
                // restore the outer save in lightRay
                ctx.restore();

                // increase percentage drawn and make the drawing slightly faster each time
                window.requestAnimationFrame(() => lightRay(percentage*1.03 + 0.02));

                return;
            } else {
                // restore the outer save in lightRay
                ctx.restore();
                image();

                // restore the save in draw that is unreachable due to returning
                ctx.restore();

                // make the checkbox checkable now that the light ray is drawn
                getRay.disabled = false;
                // make the slider movable now that the light ray is drawn (if o = f not checked)
                if(!oToF.checked && !oTo2F.checked) {
                    slider.disabled = false; 
                }
                return;
            }
        }
        // the image is upside down if the image distance is positive
        else if (i > 0) {
            // account for flipped image direction
            s = -s;

            // get the object and image tip locations
            let objTip = [-o, 100];
            let imgTip = [i, 100*s];

            // draw the rays
            rayThroughLensCenter(objTip, imgTip, percentage, false, null);
            rayParallelToFocal(objTip, imgTip, percentage, false, null);
            rayFocalToParallel(objTip, imgTip, percentage, false, null);

            // **************************** REPEAT DRAWING AS NEEDED **************************
            // draw the line until it reaches somewhere past the image tip
            if (percentage < 1.5) {
                // restore the outer save in lightRay
                ctx.restore();
                window.requestAnimationFrame(() => lightRay(percentage + 0.01));
                return;
            } else {
                // restore the outer save in lightRay
                ctx.restore();
                image();

                // restore the save in draw that is unreachable due to returning
                ctx.restore();

                // make the checkbox checkable now that the light ray is drawn
                getRay.disabled = false;
                // make the slider movable now that the light ray is drawn (if o = f not checked)
                if(!oToF.checked && !oTo2F.checked) {
                    slider.disabled = false; 
                }
                return;
            }
        }
        // the image is right side up if the image distance is negative
        else if (i < 0) {

            // get the object tip, image tip, foctal point, and lens center locations
            let objTip = [-o, 100];
            let imgTip = [i, 100*s];
            let rightFocalPt = [f, 0];
            let leftFocalPt = [-f, 0];
            let lensCenter = [0, 0];

            // draw the rays
            rayThroughLensCenter(objTip, lensCenter, percentage, true, imgTip);
            rayParallelToFocal(objTip, rightFocalPt, percentage, true, imgTip);
            rayFocalToParallel(objTip, imgTip, percentage, true, leftFocalPt);

            // **************************** REPEAT DRAWING AS NEEDED **************************
            // draw the line until it reaches somewhere past the image tip
            if (percentage < 1.5) {
                // restore the outer save in lightRay
                ctx.restore();
                window.requestAnimationFrame(() => lightRay(percentage + 0.01));
                return;
            } else {
                // restore the outer save in lightRay
                ctx.restore();
                image();

                // restore the save in draw that is unreachable due to returning
                ctx.restore();

                // make the checkbox checkable now that the light ray is drawn
                getRay.disabled = false;
                // make the slider movable now that the light ray is drawn (if o = f not checked)
                if(!oToF.checked && !oTo2F.checked) {
                    slider.disabled = false; 
                }
                return;
            }
        }

        ctx.restore();

    }

    /* Draws the light ray through the lens center
    *
    * @param {Array} objTip - the tip of the object
    * @param {Array} toPt - the desired point (will be the lens center if the light ray is going back)
    * @param {Number} percentage - the percentage of the way the light ray is drawn
    * @param {Boolean} goBack - whether the light ray should go back
    * @param {Array} imgPt - the tip of the image (if the light ray is going back)
    */
    function rayThroughLensCenter(objTip, toPt, percentage, goBack, imgPt) {
        // save the state of the canvas
        ctx.save();
        
        // get the distance going backwards (default is 0)
        let backDist = 0;
        if (goBack) {
            backDist = Math.sqrt((toPt[1] - imgPt[1])**2 + (toPt[0] - imgPt[0])**2);
        }

        // calculate the angle between the object tip and the desired endpoint
        let angle = Math.atan2(toPt[1] - objTip[1], toPt[0] - objTip[0]);

        // calculate the distance from the tip of the object to the desired endpoint
        let dist = Math.sqrt((objTip[1] - toPt[1])**2 + (objTip[0] - toPt[0])**2);

        // get the total distance
        let totalDist = dist + backDist;

        // get percentage being drawn
        let distToDraw = percentage*totalDist;

        // only drawing the first part of the ray
        if (distToDraw < dist || !goBack) {
            ctx.save();
                // put the origin at the tip of the object
                ctx.translate(objTip[0], objTip[1]);

                // draw first ray
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(distToDraw, 0);
                ctx.stroke();
            ctx.restore();
        }
        // draw back of ray if reached lens center and want ray to go back
        else {
            // Draw the real ray
            ctx.save();
                // put the origin at the tip of the object
                ctx.translate(objTip[0], objTip[1]);

                // draw first ray
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(distToDraw, 0);
                ctx.stroke();
            ctx.restore();


            // Draw the virtual ray
            ctx.save();
                // calculate the angle between the desired endpoint and the image tip
                angle = Math.atan2(imgPt[1] - toPt[1], imgPt[0] - toPt[0]);

                // put the origin at endpoint
                ctx.translate(toPt[0], toPt[1]);

                ctx.strokeStyle = 'rgb(255, 140, 0)';
                ctx.setLineDash([5, 5]);

                // draw second ray
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(distToDraw - dist, 0);
                ctx.stroke();
            // restore the save in lightRay
            ctx.restore();
        }

        // restore the save in lightRay
        ctx.restore();
    }

    /* Draws the light ray parallel then to the focal point
    *
    * @param {Array} objTip - the tip of the object
    * @param {Array} toPt - the desired point (will be the focal point if the light ray is going back)
    * @param {Number} percentage - the percentage of the way the light ray is drawn
    * @param {Boolean} goBack - whether the light ray should go back
    * @param {Array} imgPt - the tip of the image (if the light ray is going back)
    */ 
    function rayParallelToFocal(objTip, toPt, percentage, goBack, imgPt) {
        // save the state of the canvas
        ctx.save();

        // calculate the angle between the lens point and the image tip
        let angle = Math.atan2(toPt[1] - objTip[1], toPt[0] - 0);

        // the distance from the object tip to the lens point is simply o
        let dist1 = o;
        // calculate the distance from the lens point to the image tip
        let dist2 = Math.sqrt((objTip[1] - toPt[1])**2 + (0 - toPt[0])**2);

        // find the total distance of the real ray
        let realDist = dist1 + dist2;

        
        // get the distance going backwards (default is 0)
        let backDist = 0;
        if (goBack) {
            backDist = Math.sqrt((toPt[1] - imgPt[1])**2 + (toPt[0] - imgPt[0])**2);
        }

        // get the total distance of creating the virtual ray
        let virtualDist = dist1 + backDist;

        // find the proportion of the distance that will be drawn
        let distToDraw = percentage*realDist;

        // if we are still drawing the first part of the ray
        if (distToDraw < dist1) {
            ctx.save();
                // put the origin at the object tip
                ctx.translate(objTip[0], objTip[1]);

                // draw a horizontal line
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(distToDraw, 0);
                ctx.stroke();
            ctx.restore();
        } else {
            ctx.save();
                // put the origin at the object tip
                ctx.translate(objTip[0], objTip[1]);

                // draw the first part of the real ray
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(dist1, 0);
                ctx.stroke();
            ctx.restore();

            // draw the second part of the real ray
            ctx.save();
                // put the origin at the lens point where parallel ray intersects
                ctx.translate(0, objTip[1]);

                // draw the second part of the ray
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo((distToDraw - dist1)*2, 0); // draw it longer to make it go off the screen
                ctx.stroke();
            ctx.restore();

            if (goBack) {
                // draw the virtual ray
                ctx.save();
                    // calculate the angle between the desired endpoint and the image tip
                    angle = Math.atan2(imgPt[1] - toPt[1], imgPt[0] - toPt[0]);

                    // put the origin at where the real ray intersects the lens
                    ctx.translate(0, objTip[1]);

                    ctx.strokeStyle = 'rgb(255, 140, 0)';
                    ctx.setLineDash([5, 5]);

                    // draw virtual ray
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(virtualDist * percentage - dist1, 0);
                    ctx.stroke();
                ctx.restore();
            }
        }

        // restore the save in lightRay
        ctx.restore();
    }


    /* Draws the light ray focal to parallel
    *
    * @param {Array} objTip - the tip of the object
    * @param {Array} imgTip - the tip of the image
    * @param {Number} percentage - the percentage of the way the light ray is drawn
    * @param {Boolean} goBack - whether the light ray should go back
    * @param {Array} focalPt - the left focal point (only need if the light ray is going back)
    */
    function rayFocalToParallel(objTip, imgTip, percentage, goBack, focalPt) {
        // save the state of the canvas
        ctx.save();

        // calculate the angle between the object tip and the lens point at (0, imgTip[1])
        let angleObjToLens = Math.atan2(imgTip[1] - objTip[1], 0 - objTip[0]);

        // calculate distance from the object tip to the lens point
        let dist1 = Math.sqrt((objTip[1] - imgTip[1])**2 + (objTip[0] - 0)**2);

        // the distance from the lens point to the image tip is simply the image distance
        let dist2 = Math.abs(imgTip[0]); // use absolute value because the image distance can be negative

        // distance from left focal point to object tip (only relevant if going back)
        let dist3 = 0;
        if (goBack) {
            dist3 = Math.sqrt((objTip[1] - focalPt[1])**2 + (objTip[0] - focalPt[0])**2);
        }
        // angle from left focal point to object tip (only relevant if going back)
        let angleFocal = 0;
        if (goBack) {
            angleFocal = Math.atan2(objTip[1] - focalPt[1], objTip[0] - focalPt[0]);
        }

        // find the total distance for the real ray
        let realDist = dist1 + dist2;
        // find the total distance for the virtual ray
        let virtualDist = dist1 + Math.abs(i);

        // find total distance for beginning virtual ray and rest of real ray
        let totalDist = realDist + dist3;

        // find the proportion of the distance that will be drawn
        let distToDraw = percentage*totalDist;

        // if we are still drawing the initial virtual ray
        if (goBack && distToDraw < dist3) {
            ctx.save();
                // put the origin at the focal point
                ctx.translate(focalPt[0], focalPt[1]);

                // is a virtual ray
                ctx.strokeStyle = 'rgb(255, 140, 0)';
                ctx.setLineDash([5, 5]);

                // draw an angled line
                ctx.rotate(angleFocal);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(distToDraw, 0);
                ctx.stroke();
            ctx.restore();
        }
        // if we are still drawing the first part of the real ray
        else if (distToDraw < (dist3 + dist1) ) {
            if (goBack) {
                // initial virtual
                ctx.save();
                    // put the origin at the focal point
                    ctx.translate(focalPt[0], focalPt[1]);

                    // is a virtual ray
                    ctx.strokeStyle = 'rgb(255, 140, 0)';
                    ctx.setLineDash([5, 5]);

                    // draw an angled line
                    ctx.rotate(angleFocal);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(dist3, 0);
                    ctx.stroke();
                ctx.restore();
            }
            // first part of real ray
            ctx.save();
                // put the origin at the object tip
                ctx.translate(objTip[0], objTip[1]);

                // draw an angled line
                ctx.rotate(angleObjToLens);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(distToDraw - dist3, 0);

                ctx.stroke();
            ctx.restore();
        } else {
            if (goBack) {
                // initial virtual
                ctx.save();
                    // put the origin at the focal point
                    ctx.translate(focalPt[0], focalPt[1]);

                    // is a virtual ray
                    ctx.strokeStyle = 'rgb(255, 140, 0)';
                    ctx.setLineDash([5, 5]);

                    // draw an angled line
                    ctx.rotate(angleFocal);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(dist3, 0);
                    ctx.stroke();
                ctx.restore();
            }

            // draw the first (angled) part of the real ray
            ctx.save();
                // put the origin at the object tip
                ctx.translate(objTip[0], objTip[1]);

                ctx.rotate(angleObjToLens);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(dist1, 0);
                ctx.stroke();
            ctx.restore();

            // draw the second (parallel) part of the real ray
            ctx.save();
                // put the origin at the object tip
                ctx.translate(objTip[0], objTip[1]);

                ctx.rotate(angleObjToLens);
                // put the origin where the real ray intersects the lens
                ctx.translate(dist1, 0);
                // draw the second part of the (not angled) ray
                ctx.rotate(-angleObjToLens);

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(2*(distToDraw - (dist1 + dist3)), 0);
                ctx.stroke();
            ctx.restore();

            // draw the virtual ray
            if (goBack) {
                ctx.save();
                    // put the origin at the object tip
                    ctx.translate(objTip[0], objTip[1]);

                    ctx.rotate(angleObjToLens);
                    // put the origin where the real ray intersects the lens
                    ctx.translate(dist1, 0);
                    // draw the second part of the (not angled) ray
                    ctx.rotate(-angleObjToLens);

                    // is a virtual ray
                    ctx.strokeStyle = 'rgb(255, 140, 0)';
                    ctx.setLineDash([5, 5]);

                    // draw virtual ray straight back
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-2*(virtualDist * percentage - dist1), 0);
                    ctx.stroke();
                ctx.restore();
            }
        }

        // restore the save in lightRay
        ctx.restore();    

    }

    /* Draws the arrow representing the object and image
    *
    */
    function arrow() {
        // origin at the bottom
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 100);
        ctx.lineTo(10, 90);
        ctx.moveTo(0, 100);
        ctx.lineTo(-10, 90);
        ctx.stroke();
    }

    /* Draws the object
    *
    */
    function object() {
        // object length at the slider value
        ctx.save();
        ctx.translate(Number(slider.value), 0);
        ctx.strokeStyle = 'red';
        arrow();
        ctx.restore();    
        
        // update the object distance
        o = -Number(slider.value);
    }

    /* Draws the image
    *
    */
    function image() {

        // get the image magnification
        let s = magnification();

        // do not draw the image if it is at infinity
        if (i === undefined) {
            return;
        }

        // the image is upside down if the image distance is positive
        if (i > 0) {
            s = -s;
        }

        // draw the image
        ctx.save();
        ctx.translate(i, 0);
        ctx.scale(s, s);
        ctx.strokeStyle = 'blue';
        arrow();
        ctx.restore();
        
    }

    /* Draws the focal points
    *
    */
    function focalPoints() {
        // focal point 1 at x = -f
        ctx.save();
        ctx.translate(-f, 0);
        dot();
        ctx.restore();

        // focal point 2 at x = f
        ctx.save();
        ctx.translate(f, 0);
        dot();
        ctx.restore();      
    }

    /* Draws the 2f points
    *
    */
    function twiceFocal() {
        // focal point 1 at x = -f
        ctx.save();
        ctx.translate(-2*f, 0);
        ctx.fillStyle = 'green';
        dot();
        ctx.restore();

        // focal point 2 at x = f
        ctx.save();
        ctx.translate(2*f, 0);
        ctx.fillStyle = 'green';
        dot();
        ctx.restore();      
    }

    /* Draws a dot at the origin
    *
    */
    function dot() {
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, 2 * Math.PI);
        ctx.fill();
    }

    /* Calculates the image distance
    *  Thin Lens Formula: 1/f = 1/o + 1/i
    *              1/i = 1/f - 1/o
    *              i = 1 / (1/f - 1/o)
    * @returns {Number} the image distance
    */
    function imageDistance() {
        // if o = f, then image is at infinity (we don't want the image to show up)
        if (o === f) {
            i = undefined;
            return i;
        }

        // update image distance
        i = 1 / (1 / f - 1 / o);

        return i;
    }

    /* Calculates the image magnification
    *  M = |i|/o
    *
    * @returns {Number} the magnification
    */
    function magnification() {
        return Math.abs(i) / o;
    }

} 

console.log("page 1 js loaded")