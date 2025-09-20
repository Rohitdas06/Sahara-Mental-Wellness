// // API service that uses real backend
// import { CURRENT_BACKEND_URL } from '../config';

// class ApiService {
//   constructor() {
//     this.baseUrl = CURRENT_BACKEND_URL; // Render backend URL
//   }

//   async makeRequest(endpoint, options = {}) {
//     const url = `${this.baseUrl}${endpoint}`;
//     console.log('🔍 API Service makeRequest:', {
//       url,
//       method: options.method || 'GET',
//       headers: options.headers,
//       body: options.body
//     });
    
//     const response = await fetch(url, {
//       headers: {
//         'Content-Type': 'application/json',
//         ...options.headers
//       },
//       ...options
//     });

//     console.log('🔍 API Service response:', {
//       status: response.status,
//       statusText: response.statusText,
//       ok: response.ok
//     });

//     if (response.ok) {
//       const data = await response.json();
//       console.log('🔍 API Service response data:', data);
//       return data;
//     } else {
//       const errorText = await response.text();
//       console.error('🔍 API Service error response:', errorText);
//       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//     }
//   }

//   async getSessionInfo() {
//     return await this.makeRequest('/api/session-info');
//   }

//   async startChat(sessionId, userId) {
//     return await this.makeRequest('/api/chat/start', {
//       method: 'POST',
//       headers: {
//         'X-Session-ID': sessionId,
//         'X-User-ID': userId,
//         'X-Is-Guest': 'true'
//       }
//     });
//   }

//   async sendMessage(sessionId, text, userId) {
//     console.log('🔍 API Service sendMessage called with:', {
//       sessionId,
//       text,
//       userId,
//       baseUrl: this.baseUrl
//     });
    
//     return await this.makeRequest(`/api/chat/${sessionId}/message`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'X-Session-ID': sessionId,
//         'X-User-ID': userId,
//         'X-Is-Guest': 'true'
//       },
//       body: JSON.stringify({ text })
//     });
//   }

//   async getJournalEntries(sessionId) {
//     return await this.makeRequest('/api/journal/entries', {
//       headers: {
//         'X-Session-ID': sessionId,
//         'X-User-ID': 'guest',
//         'X-Is-Guest': 'true'
//       }
//     });
//   }

//   async saveJournalEntry(sessionId, content, date, prompt) {
//     return await this.makeRequest('/api/journal/save', {
//       method: 'POST',
//       headers: {
//         'X-Session-ID': sessionId,
//         'X-User-ID': 'guest',
//         'X-Is-Guest': 'true'
//       },
//       body: JSON.stringify({ content, date, prompt })
//     });
//   }

//   async getChatHistory(userId) {
//     return await this.makeRequest('/api/chat/history', {
//       headers: {
//         'X-User-ID': userId,
//         'X-Is-Guest': 'true'
//       }
//     });
//   }
// }

// export default new ApiService();










// import { CURRENT_BACKEND_URL } from '../config';

// class ApiService {
//   constructor() {
//     this.baseUrl = CURRENT_BACKEND_URL; // Uses deployed or local backend based on env
//   }

//   async makeRequest(endpoint, options = {}) {
//     const url = `${this.baseUrl}${endpoint}`;
//     const response = await fetch(url, {
//       headers: {
//         'Content-Type': 'application/json',
//         ...options.headers
//       },
//       ...options
//     });

//     if (response.ok) {
//       return await response.json();
//     } else {
//       const errorText = await response.text();
//       throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
//     }
//   }

//   async getSessionInfo() {
//     return this.makeRequest('/api/session-info');
//   }

//   async startChat(sessionId, userId) {
//     return this.makeRequest('/api/chat/start', {
//       method: 'POST',
//       headers: {
//         'X-Session-ID': sessionId,
//         'X-User-ID': userId,
//         'X-Is-Guest': 'true'
//       }
//     });
//   }

//   async sendMessage(sessionId, text, userId) {
//     return this.makeRequest(`/api/chat/${sessionId}/message`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'X-Session-ID': sessionId,
//         'X-User-ID': userId,
//         'X-Is-Guest': 'true'
//       },
//       body: JSON.stringify({ text })
//     });
//   }

//   async getJournalEntries(sessionId) {
//     return this.makeRequest('/api/journal/entries', {
//       headers: {
//         'X-Session-ID': sessionId,
//         'X-User-ID': 'guest',
//         'X-Is-Guest': 'true'
//       }
//     });
//   }

//   async saveJournalEntry(sessionId, content, date, prompt) {
//     return this.makeRequest('/api/journal/save', {
//       method: 'POST',
//       headers: {
//         'X-Session-ID': sessionId,
//         'X-User-ID': 'guest',
//         'X-Is-Guest': 'true'
//       },
//       body: JSON.stringify({ content, date, prompt })
//     });
//   }

//   async getChatHistory(userId) {
//     return this.makeRequest('/api/chat/history', {
//       headers: {
//         'X-User-ID': userId,
//         'X-Is-Guest': 'true'
//       }
//     });
//   }
// }

// export default new ApiService();











import { CURRENT_BACKEND_URL } from '../config';

class ApiService {
  constructor() {
    this.baseUrl = CURRENT_BACKEND_URL; // Uses deployed or local backend URL based on environment
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
  }

  async getSessionInfo() {
    return this.makeRequest('/api/session-info');
  }

  async startChat(sessionId, userId) {
    return this.makeRequest('/api/chat/start', {
      method: 'POST',
      headers: {
        'X-Session-ID': sessionId,
        'X-User-ID': userId,
        'X-Is-Guest': 'true'
      }
    });
  }

  async sendMessage(sessionId, text, userId) {
    return this.makeRequest(`/api/chat/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
        'X-User-ID': userId,
        'X-Is-Guest': 'true'
      },
      body: JSON.stringify({ text })
    });
  }

  async getJournalEntries(sessionId) {
    return this.makeRequest('/api/journal/entries', {
      headers: {
        'X-Session-ID': sessionId,
        'X-User-ID': 'guest',
        'X-Is-Guest': 'true'
      }
    });
  }

  async saveJournalEntry(sessionId, content, date, prompt) {
    return this.makeRequest('/api/journal/save', {
      method: 'POST',
      headers: {
        'X-Session-ID': sessionId,
        'X-User-ID': 'guest',
        'X-Is-Guest': 'true'
      },
      body: JSON.stringify({ content, date, prompt })
    });
  }

  async getChatHistory(userId) {
    return this.makeRequest('/api/chat/history', {
      headers: {
        'X-User-ID': userId,
        'X-Is-Guest': 'true'
      }
    });
  }
}

export default new ApiService();
