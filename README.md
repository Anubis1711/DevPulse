Vereisten:

Node.js en npm (of Yarn) – voor packagebeheer en het draaien van de server.
MongoDB – als database voor opslag van gebruikers, posts, en statistieken.
Express – voor het opzetten van de server.
Axios – om HTTP-verzoeken te maken naar de GitHub API voor commit-informatie.

Er zit nog aardig wat debug code in het project die er eigenlijk uit zou moeten. Vanwege tijdsdruk is het me helaas niet gelukt om dit allemaal netjes op te schonen. Je zult hier en daar dus nog console.logs en testopdrachten tegenkomen die ik normaal gesproken zou verwijderen. Deze code heeft geholpen bij het testen en debuggen tijdens het bouwen, maar voor een uiteindelijke versie zou dit er uiteraard uit gehaald moeten worden om de code wat schoner en efficiënter te maken. Sorry.


            <!--<% if (typeof currentUser !== 'undefined' && currentUser._id.toString() !== profileUser._id.toString()) { %>
        <div>
            <% if (currentUser.following.includes(profileUser._id)) { %>
                <form action="/unfollow/<%= profileUser._id %>" method="POST">
                    <button type="submit">Ontvolgen</button>
                </form>
            <% } else { %>
                <form action="/follow/<%= profileUser._id %>" method="POST">
                    <button type="submit">Volgen</button>
                </form>
            <% } %>
        </div>
    <% } %>-->

    <!--<% if (profileUser && profileUser.followers.length > 0) { %>
                        <ul>
                            <% profileUser.followers.forEach(follower => { %>
                                <li><%= follower.name || follower.username %></li>
                            <% }); %>
                        </ul>
                    <% } else { %>
                        <p>Geen volgers gevonden.</p>
                    <% } %>-->


Demodata erin zetten voor followers etc. 

alvast statische vergelijking maken. 

migrations bestuderen mongoDB. 

Sprint 3:
Vergelijking meer in tabelstructuur. (check)!!
Wat creatiever zijn (icoontjes), datum bij meeste commits per dag.
Zoekknop weg, automatisch zoeken na een aantal tekens.
notification, gamification (challenges, achievements, eentje kiezen om uit te werken)
side-by-side koppelen aan zoekactie/ zoeken van profiel mooi maken (pfp, naam, sidebyside, een mooie display)