# Pittsburgh Homefinder


Our team chose to work on the Pittsburgh homes dataset, which provides a list
of properties throughout the city along with a number of helpful features,
including price, area, location, number of bathrooms, etc. The user that we
imagined interacting with our project was a person looking for a house in the
area--we aimed to enable broad exploration of the spectrum of available
properties as well as a detailed examination of one or two specific properties
that would be particularly appropriate for the user.

We chose to feature a map of the area, with points representing each house. We chose to not vary the styling of these points based on the characteristics of the house, as we thought that may be too overwhelming, and might make it difficult for users to differentiate between houses. On selecting a house, the dot becomes larger and changes color to signify selection, and some details appear below. If the user is interested in a specific area, they can click on a neighborhood to zoom into it. We did this because we thought some users may have strong preferences for the neighborhood they live in.

For our filters, we chose to create histograms to show the distribution of houses. This helps the users immediately get a bearing of the cost, size, and ages of the houses in the area so they can properly set their expectations of availability. The ording of the filters is vertically based on what were presume is most important to the users; first, the beds and baths, then the price, then the age of the home, then the size. However, they are all viewable without scrolling, so the user can see their filters all at once.