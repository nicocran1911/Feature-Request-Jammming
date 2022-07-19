const clientID = '6c3283bb730741bcbb347bff90753769';
// const redirectURI = 'http://localhost:3000/' 
const redirectURI= 'http://squalid-quiver.surge.sh';
let accessToken;

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const accessTokenExpireMatch = window.location.href.match(/expires_in=([^&]*)/);
      
    if (accessTokenMatch && accessTokenExpireMatch) {
        accessToken = accessTokenMatch[1];
        const tokenExpireTime = accessTokenExpireMatch[1];
        window.setTimeout(() => accessToken = '', tokenExpireTime * 1000);
        window.history.pushState('Access Token', null, '/');
        return accessToken;
    } else {
        window.location = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-private&redirect_uri=${redirectURI}`;
    }
  },
    
  search(searchTerm) {
      let accessToken = this.getAccessToken();
      const apiHeadders = {
                        headers: {Authorization: `Bearer ${accessToken}`}
                        }

    return fetch(`https://api.spotify.com/v1/search?type=track&q=${searchTerm}`, apiHeadders).then(response => {
        if(response.ok){
        return response.json();
        } else {
          throw new Error ('Request Failed!');
        }}, networkError => {
          console.log(networkError.message);
        }).then(jsonResponse => {
        
        if(jsonResponse.hasOwnProperty('tracks')) {
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album,
                uri: track.uri
            }));
        } 
    });
  },
    
  async savePlaylist(name, trackURIs) {
    if(accessToken === undefined) {
      this.getAccessToken();
    }
    if (name === undefined || trackURIs === undefined) {
      return;
    } else {
      let userId = await this.findUserId();
      let playlistID;
      fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": 'application/json'
        },
        body: JSON.stringify({name: name})
      }).then(response => {return response.json()}
      ).then(playlist => {
        playlistID = playlist.id;
        this.addTracks(playlistID, trackURIs, userId);
      });
    }
  },

  addTracks(playlistID, trackURIs, userId) {
    fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistID}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": 'application/json'
      },
      body: JSON.stringify({uris: trackURIs})
    });
  },

  findUserId() {
    if(accessToken === undefined) {
      this.getAccessToken();
    }
    let userId;
    return fetch(`https://api.spotify.com/v1/me`, {headers: {
      Authorization: `Bearer ${accessToken}`
    }}
      ).then(response => {return response.json()}
      ).then(jsonResponse => {
        userId = jsonResponse.id;
        return userId;
      });
  }
    
};

export default Spotify;