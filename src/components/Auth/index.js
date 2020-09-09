import React from 'react'
import {
  Container,
  Row,
  Col,
  Jumbotron,
  Button,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap'

export default class Auth extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      APIKEY: process.env.REACT_APP_APIKEY,
      CLIENTID: process.env.REACT_APP_CLIENTID,
      SCOPE: 'https://www.googleapis.com/auth/calendar'
    }
  }

  componentWillMount () {
    this.handleClientLoad()
  }

  handleClientLoad = () => {
    window.gapi.load('client:auth2', this.initClient)
  }

  initClient = () => {
    var discoveryUrl =
      'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'

    window.gapi.client
      .init({
        apiKey: this.state.APIKEY,
        clientId: this.state.CLIENTID,
        discoveryDocs: [discoveryUrl],
        scope: this.state.SCOPE
      })
      .then(() => {
        window.$GoogleAuth = window.gapi.auth2.getAuthInstance()

        window.$GoogleAuth.isSignedIn.listen(this.updateSigninStatus)

        // var user = window.$GoogleAuth.currentUser.get()
        this.setSigninStatus()
      })
  }

  handleAuthClick = () => {
    if (window.$GoogleAuth.isSignedIn.get()) {
      window.$GoogleAuth.signOut()
    } else {
      window.$GoogleAuth.signIn()
    }
  }

  revokeAccess = () => {
    window.$GoogleAuth.disconnect()
  }

  setSigninStatus = isSignedIn => {
    var user = window.$GoogleAuth.currentUser.get()
    var isAuthorized = user.hasGrantedScopes(this.state.SCOPE)
    if (isAuthorized) {
      window.$('#sign-in-or-out-button').html('Sign out')
      window.$('#revoke-access-button').css('display', 'inline-block')
      window
        .$('#auth-status')
        .html(
          'You are currently signed in and have granted ' +
            'access to this app.'
        )
      window.$('#app').css('display', 'inline-block')
    } else {
      window.$('#sign-in-or-out-button').html('Sign In/Authorize')
      window.$('#revoke-access-button').css('display', 'none')
      window
        .$('#auth-status')
        .html('You have not authorized this app or you are signed out.')
      window.$('#app').css('display', 'none')
    }
  }

  updateSigninStatus = isSignedIn => {
    this.setSigninStatus()
  }

  appendPre = message => {
    var pre = document.getElementById('content')
    var textContent = document.createTextNode(message + '\n')
    pre.appendChild(textContent)
  }

  listUpcomingEvents = () => {
    window.gapi.client.calendar.events
      .list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 10,
        orderBy: 'startTime'
      })
      .then(response => {
        var events = response.result.items
        this.appendPre('Upcoming events:')

        if (events.length > 0) {
          for (var i = 0; i < events.length; i++) {
            var event = events[i]
            var when = event.start.dateTime
            if (!when) {
              when = event.start.date
            }
            this.appendPre(i + 1 + '. ' + event.summary + ' (' + when + ')')
          }
        } else {
          this.appendPre('No upcoming events found.')
        }
      })
  }

  demoPost = () => {
    var date = new Date()
    date = date.setHours(date.getHours() + 1)
    var event = {
      summary: 'Google I/O 2015',
      location: '800 Howard St., San Francisco, CA 94103',
      description: "A chance to hear more about Google's developer products.",
      start: {
        dateTime: new Date().toISOString(),
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: new Date(date).toISOString(),
        timeZone: 'Asia/Kolkata'
      },
      // recurrence: ['RRULE:FREQ=DAILY;COUNT=2'],
      attendees: [
        { email: 'visioninc12@gmail.com' }
        // { email: 'sbrin@example.com' }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 }
        ]
      }
    }

    var request = window.gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event
    })

    request.execute(event => {
      // this.appendPre('Event created: ' + event.htmlLink)
      var pre = document.getElementById('content')
      pre.innerHTML = ''
      var textContent = `Event created: <a href="${event.htmlLink}">${event.description}</a><br>`
      pre.innerHTML += textContent
    })
  }

  render () {
    return (
      <Container>
        <Row className='App-header'>
          <Col>
            <Jumbotron>
              <h1>Wrapped Schedular</h1>
              <p>
                Wrapped Schedular (ws) is a free open source software developed
                to help people around the globe to use it to schedule their
                meetings, know about their days schedule, and much more.
              </p>
              <p>
                <OverlayTrigger
                  placement='bottom'
                  overlay={
                    <Tooltip id='button-tooltip-2'>
                      Check out this avatar
                    </Tooltip>
                  }
                >
                  {({ ref, ...triggerHandler }) => (
                    <Row>
                      <Button
                        variant='primary'
                        className='d-inline-flex align-items-center'
                        {...triggerHandler}
                        ref={ref}
                        id='sign-in-or-out-button'
                        onClick={() => this.handleAuthClick()}
                      >
                        <span className='ml-1'>Sign in / Authorize</span>
                      </Button>
                      &nbsp;
                      <Button
                        variant='primary'
                        className='d-inline-flex align-items-center'
                        {...triggerHandler}
                        ref={ref}
                        id='revoke-access-button'
                        onClick={() => this.revokeAccess()}
                      >
                        <span className='ml-1'>Revoke access</span>
                      </Button>
                      <div
                        id='auth-status'
                        style={{ display: 'inline', paddingLeft: '25px' }}
                      ></div>
                      <hr></hr>
                    </Row>
                  )}
                </OverlayTrigger>
              </p>
            </Jumbotron>
          </Col>
        </Row>
        <Row id='app' style={{ display: 'none' }}>
          <Button variant='primary' onClick={() => this.listUpcomingEvents()}>
            Fetch user schedule
          </Button>
          &nbsp;
          <Button variant='primary' onClick={() => this.demoPost()}>
            Create Event
          </Button>
          <p id='content'></p>
        </Row>
      </Container>
    )
  }
}
