app.get('/profile', async (req, res) => {
  if (!req.session.accessToken) {
    return res.redirect('/');
  }

  try {
    // Stel de GraphQL-query op
    const query = `
      query {
        viewer {
          login
          name
          avatarUrl
          bio
          url
          publicRepos: repositories(isFork: false, privacy: PUBLIC) {
            totalCount
          }
          followers {
            totalCount
          }
          following {
            totalCount
          }
        }
      }
    `;

    // Maak een POST-aanroep naar de GitHub GraphQL API
    const response = await axios.post(
      'https://api.github.com/graphql',
      { query },
      {
        headers: {
          Authorization: `Bearer ${req.session.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    

    // Haal gebruikersgegevens uit de response
    const userData = response.data.data.viewer;

    // Render de profielpagina met de gebruikersgegevens
    res.render('profile', { user: userData });
  } catch (error) {
    console.error("Error bij het ophalen van gebruikersgegevens met GraphQL:", error.message);
    res.status(500).send("Er ging iets mis bij het ophalen van gebruikersgegevens.");
  }
});
