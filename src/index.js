import React from 'react';
import ReactDOM from 'react-dom';
import '../style/style.css';



const routes = JSON.parse(localStorage.getItem('routes')) || [];




class App extends React.Component {
 
   constructor(props) {
     super(props);
     
     this.state = {routes: this.props.routes};
     
     this.add = this.add.bind(this);
     this.done = this.done.bind(this); 
}
 
 
   add(e) {
     const routes = this.props.routes;
     
     routes.push([ReactDOM.findDOMNode(this.refs.myInput).value, ReactDOM.findDOMNode(this.refs.myInput2).value]);

      
     localStorage.setItem('routes', JSON.stringify(routes));
 
     this.setState({ routes: routes });

     e.target.previousElementSibling.value=null;
     e.target.previousElementSibling.previousElementSibling.value=null;

   }
   
 
   done(route) {
     routes.splice(routes.indexOf(route), 1);
     localStorage.setItem('routes', JSON.stringify(routes));
     
     this.setState({ routes: routes});
   }
  
  componentDidMount() {
    ReactDOM.findDOMNode(this.refs.myInput).value = "Belgrade";
    ReactDOM.findDOMNode(this.refs.myInput2).value = "Novi Sad";
  }

   render() {
     
       const mapped = this.state.routes.map(function(route, i) {
                 return (
                   <li>
                     <b className="index">#{i+1}</b>
                     <RouteItem route={route} done={this.done}/>
                   </li>
                 )
               }.bind(this));
       
     return (
       
     
       <div id="app">
          <div id="add">  
            
             <input type="text" id="input1" ref="myInput" /> 
             <input type="text" id="input2" ref="myInput2" />
             <button className="submit" onClick={this.add}>Submit</button>
              
             <ul>
               {mapped}
             </ul>
            
             <b class="counter">You have {this.props.routes.length} route(s) </b>
            
          </div>
         
          <ContactBody /> 
         
       </div>
     );
   }
};





  class RouteItem extends React.Component{

    constructor(props) {
       super(props);
       this.done = this.done.bind(this);
       this.show = this.show.bind(this);
     }

    componentDidMount() {
   
    }
    
    
    done() {
        this.props.done(this.props.route);
     }
    
    
    show(e) {
      add.style.display="none";  
      map.style.display="block"; 
      hide.style.display="block"; 
      descr.style.display="block";
      
      descr.innerHTML = `${e.target.parentNode.previousElementSibling.innerHTML} ${e.target.previousElementSibling.previousElementSibling.innerHTML} - ${e.target.previousElementSibling.innerHTML}`;
    
      const start = e.target.previousElementSibling.previousElementSibling.innerHTML;
      const end = e.target.previousElementSibling.innerHTML;
      
      setTimeout(function(e){
      
      
      let directionsDisplay;
      const directionsService = new google.maps.DirectionsService();
       
      var map;

      const belgrade = new google.maps.LatLng(44.8089237, 20.4813078);
      const mapOptions = {
        zoom: 6,
        center: belgrade
      }
      
      var map = new google.maps.Map(document.getElementById('map'), mapOptions);
   
      directionsDisplay = new google.maps.DirectionsRenderer();

      const waypts = [];

      const request = {
          origin: start,
          destination: end,
          waypoints: waypts,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING
      };
  
      directionsService.route(request, function(response, status) {
    
        if (status == google.maps.DirectionsStatus.OK) {
          
             directionsDisplay.setDirections(response);
          

          const length = Math.round(directionsDisplay.getDirections().routes[directionsDisplay.getRouteIndex()].legs[0].distance.value / 1000);   
          const time = (length/80).toFixed(2);
          const timearray = time.split('.').map(parseFloat);

          const hours = time.toString()[0];
          const hours2 = `${Number(time.toString()[0])}${Number(time.toString()[1])}`;

          const mins = `${time.toString()[2]}${time.toString()[3]}`;
          const mins2 = `${time.toString()[3]}${time.toString()[4]}`;

          const minsfin = (Number(mins) * 60 / 100).toFixed(0);
          const minsfin2 = (Number(mins2) * 60 / 100).toFixed(0);

          if (hours<=1) {
            output.innerHTML = length + " km. About " + hours + " hour and " + mins + " mins";
          } 

          else if (time.toString().length == 5) {
            output.innerHTML = length + " km. About " + hours2 + " hour and " + minsfin2 + " mins";
          } 

          else output.innerHTML = length + " km. About " + hours + " hours and " + minsfin + " mins";

          const route = response.routes[0];
        }
    });
  
      directionsDisplay.setMap(map);
        
      setTimeout(function(e){output.style.display="block";},100);
        
  }, 0) 

  }
   
     render() {
       
      return 	(
             <li>
               <span>-</span>
               <p id="start">{this.props.route[0]} </p>
                
               <p id="end"> {this.props.route[1]} </p>

               <button id="show" onClick={this.show}>Details</button>
               <button id="del" onClick={this.done}>Delete</button>
             </li>)
       }
   }
   
   
  

   class ContactBody extends React.Component {
  
    constructor(props) {
       super(props);
       this.hide = this.hide.bind(this);
     }

     
    getGoogleMaps() {
 
      if (!this.googleMapsPromise) {
        this.googleMapsPromise = new Promise((resolve) => {
          window.resolveGoogleMapsPromise = () => {
            resolve(google);  
            delete window.resolveGoogleMapsPromise;
          }; 
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDbAz1XXxDoKSU2nZXec89rcHPxgkvVoiw&callback=resolveGoogleMapsPromise`;
          script.async = true;
          document.body.appendChild(script);
      });
    }
  
      return this.googleMapsPromise;
   }
  
   componentWillMount() {
      this.getGoogleMaps();
    }
     
   hide(e) {
     map.style.display="none";
     e.target.style.display ="none";
     add.style.display="block";
     map.innerHTML="";
     descr.style.display="none";
     output.style.display="none";
   }  

    render() {
      return (
        <div div id="mapvid">
          <button id="hide" onClick={this.hide}>Go Back</button>
          
          <b id="descr">Go Back</b>
          
          <div id="map"></div> 
          
          <p id="output"></p>
        </div>
      )
    }
  }
  
  


 
  

ReactDOM.render(<App routes={routes} />, document.getElementById('root'));