import React, { Component } from 'react';
import {
  Button, TextField, Typography, Dialog, DialogActions, LinearProgress,
  DialogTitle, DialogContent, TableBody, Table,
  List, ListItem, ListItemText,
  TableContainer, TableHead, TableRow, TableCell
} from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import swal from 'sweetalert';
const axios = require('axios');
const moment = require('moment');
const Pusher = require('pusher-js');


export default class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      name: '',
      token: '',
      openNoteModal: false,
      openCallEditModal: false,
      id: '',
      call_type: '',
      duration: '',
      direction: '',
      from: '',
      to: '',
      via: '',
      is_archived: '',
      created_at: '',
      notes: [],
      page: 1,
      perpage: 10,
      search: '',
      calls: [],
      pages: 0,
      loading: false
    };
  }

  componentDidMount = () => {
    var token = localStorage.getItem('token');
    setInterval(()=>{
      axios.post('https://frontend-test-api.aircall.io/auth/refresh-token', { 
      },{headers:{
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }}).then((res) => {
        localStorage.setItem('token',res.data.access_token)
        token = localStorage.getItem('token');
      }).catch((err) => {
        if (err.response && err.response.data && err.response.data.error) {
          swal({
            text: err.response.data.error,
            icon: "error",
            type: "error"
          });
        }
      });
    },100000)
   
    if (!token) {
      this.props.history.push('/login');
    } else {
      this.setState({ token: token }, () => {
        this.getCall();
      });
    }
 

    const pusher = new Pusher('d44e3d910d38a928e0be', {
      cluster: 'eu',
      authEndpoint: 'https://frontend-test-api.aircall.io/pusher/auth',
      auth: {
        headers: {
            'Authorization':  `Bearer ${token}` // CSRF token
        }
      }
    });
    var channel = pusher.subscribe('private-aircall');
    channel.bind('update-call', function(data) {

    });

  }

  getCall = () => {
    
    this.setState({ loading: true });

    let data = '?';
    data = `${data}offset=${this.state.page}&limit=${this.state.perpage}`;
    if (this.state.search) {
      data = `${data}&search=${this.state.search}`;
    }
    axios.get(`https://frontend-test-api.aircall.io/calls${data}`, {
      headers: {
        'token': this.state.token,
        'Authorization': `Bearer ${this.state.token}`
      }
    }).then((res) => {
      let sortedCars1 = res.data.nodes.sort((a, b) => new Date(...a.created_at.split('/').reverse()) - new Date(...b.created_at.split('/').reverse()));
      this.setState({ loading: false, calls: sortedCars1, pages: Math.round(res.data.totalCount/10) });
    }).catch((err) => {
      swal({
        text: err.response.data.error,
        icon: "error",
        type: "error"
      });
      this.setState({ loading: false, calls: [], pages: 0 },()=>{});
    });
  }

  archiveCall = (id) => {
    axios.put(`https://frontend-test-api.aircall.io/calls/${id}/archive`, {
      id: id
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then((res) => {

      swal({
        text: res.data.message,
        icon: "success",
        type: "success"
      });

      this.setState({ page: 1 }, () => {
        this.pageChange(null, 1);
      });
    }).catch((err) => {
      swal({
        text: err.response.data.error,
        icon: "error",
        type: "error"
      });
    });
  }

  pageChange = (e, page) => {
    this.setState({ page: page }, () => {
      this.getCall();
    });
  }

  logOut = () => {
    localStorage.setItem('token', null);
    this.props.history.push('/');
  }

  addNotes = () => {

    axios.post(`https://frontend-test-api.aircall.io/calls/${this.state.id}/note`, {
      content:  this.state.name
    }, {
      headers: {
        'Authorization': `Bearer ${this.state.token}`
      }
    }).then((res) => {
      swal({
        text: res.data.message,
        icon: "success",
        type: "success"
      });

      this.handleCallClose();
      this.setState({...this.state, name: ''}, () => {
        this.getCall();
      });
    }).catch((err) => {
      swal({
        text: err.response.data.error,
        icon: "error",
        type: "error"
      });
      this.handleCallClose();
    });

  }

  onChange = (e) => {
    if (e.target.files && e.target.files[0] && e.target.files[0].name) {
      this.setState({ fileName: e.target.files[0].name }, () => { });
    }
    this.setState({ [e.target.name]: e.target.value }, () => { });
    if (e.target.name == 'search') {
      this.setState({ page: 1 }, () => {
        this.getProduct();
      });
    }
  };

  handleCallEditOpen = (data) => {
    this.setState({
      openCallEditModal: true,
      id: data.id,
      call_type: data.call_type,
      duration: data.duration,
      direction: data.direction,
      from: data.from,
      to: data.to,
      via: data.via,
      is_archived: data.is_archived,
      created_at: data.created_at,
      notes: data.notes,
    });
  };

  handleCallEditClose = () => {
    this.setState({ openCallEditModal: false });
  };

  handleNoteOpen = () => {
    this.setState({
      openNoteModal: true,
    });
  };

  handleCallClose = () => {
    this.setState({ openNoteModal: false });
  };

  render() {
    return (
      <div>
        {this.state.loading && <LinearProgress size={40} />}
        <div>
          <h2>Dashboard ({localStorage.getItem('user_name')})</h2>
          <Button
            className="button_style"
            variant="contained"
            size="small"
            onClick={this.logOut}
          >
            Log Out
          </Button>
        </div>

        {/* Add Product */}
        <Dialog
          open={this.state.openNoteModal}
          onClose={this.handleCallClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Add Note</DialogTitle>
          <DialogContent>
            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="name"
              onChange={this.onChange}
              placeholder="Enter Note"
              required
            /><br />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCallClose} color="primary">
              Cancel
            </Button>
            <Button
              disabled={this.state.name == ''}
              onClick={(e) => this.addNotes()} color="primary" autoFocus>
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Product */}
        <Dialog
          open={this.state.openCallEditModal}
          onClose={this.handleCallEditClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Call Information</DialogTitle>
          <DialogContent
            color='secondary'>
            <Typography>ID: <span  className="text-danger">{this.state.id}</span></Typography>
            <Typography>Call Type: <span  className="text-danger">{this.state.call_type.toUpperCase()}</span></Typography>
            <Typography>Duration: <span  className="text-danger">{this.state.duration}</span></Typography>
            <Typography>From: <span  className="text-danger">{this.state.from}</span></Typography>
            <Typography>To: <span  className="text-danger">{this.state.to}</span></Typography>
            <Typography>Via: <span  className="text-danger">{this.state.via}</span></Typography>
            <Typography>Is Archived: <span  className="text-danger">{String(this.state.is_archived).toUpperCase()}</span></Typography>
            <Typography>CreatedAt: <span  className="text-danger">{moment(this.state.created_at).format('MMMM Do YYYY, h:mm:ss a')}</span></Typography>
            <Typography>Notes List Below: <span  className="text-danger">{
                <List style={{width: '500px', bgcolor: '#efefef'}}>
                  {this.state.notes.length === 0
                    ?
                    'No Notes' 
                    :
                    this.state.notes.map(item => (
                    <ListItem key={item.id}>
                      <ListItemText primary={`==> ${item.content}`}/>
                    </ListItem>
                  ))}
                </List>
            }</span></Typography>
            <br />
          </DialogContent>

          <DialogActions>
            <Button onClick={this.handleCallEditClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={(e) => this.handleNoteOpen()} color="primary" autoFocus>
              Add Notes
            </Button>
          </DialogActions>
        </Dialog>

        <br />

        <TableContainer>
          <TextField
            id="standard-basic"
            type="search"
            autoComplete="off"
            name="search"
            value={this.state.search}
            placeholder="Search by call type"
            required
          />
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="center">Call Type</TableCell>
                <TableCell align="center">Duration</TableCell>
                <TableCell align="center">Direction</TableCell>
                <TableCell align="center">From</TableCell>
                <TableCell align="center">To</TableCell>
                <TableCell align="center">Via</TableCell>
                <TableCell align="center">Is Archived</TableCell>
                <TableCell align="center">Created At</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {this.state.calls.map((row) => (
                <TableRow key={row.id}>
                  <TableCell align="center">{row.call_type.toUpperCase()}</TableCell>
                  <TableCell align="center">{row.duration}</TableCell>
                  <TableCell align="center">{row.direction.toUpperCase()}</TableCell>
                  <TableCell align="center">{row.from}</TableCell>
                  <TableCell align="center">{row.to}</TableCell>
                  <TableCell align="center">{row.via}</TableCell>
                  <TableCell align="center">{String(row.is_archived).toUpperCase()}</TableCell>
                  <TableCell align="center">{moment(row.created_at).format('MMMM Do YYYY, h:mm:ss a')}</TableCell>
                  <TableCell align="center">
                    <Button
                      className="button_style"
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={(e) => this.handleCallEditOpen(row)}
                    >
                      View
                  </Button>
                    <Button
                      className="button_style"
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={(e) => this.archiveCall(row.id)}
                    >
                      Archive
                  </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <br />
          <Pagination count={this.state.pages} page={this.state.page} onChange={this.pageChange} color="primary" />
        </TableContainer>

      </div>
    );
  }
}