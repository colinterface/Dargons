/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';
import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  TextInput,
  View,
  MapView,
  TouchableOpacity,
  ScrollView,
  ListView,
  AlertIOS,
  WebView,
} from 'react-native';
import { isUri } from 'valid-url';
import Firebase from 'firebase';
const firebaseRef = new Firebase('https://crackling-fire-7566.firebaseio.com/');

const dataSource = new ListView.DataSource({
  rowHasChanged: (r1, r2) => r1 !== r2,
});

class Dargons extends Component {
  constructor() {
    super();
    this.state = {
      region: {
        latitude: 37.82033945636984,
        longitude: -122.2825463318011,
      },
      satellite: false,
      addingWaypoint: false,
      animateLastWaypoint: false,
      waypoints: [],
      selectedWaypoint: {},
      showWaypointList: false,
    };
  }

  componentDidMount() {

    firebaseRef.child('waypoints').on('value', (dataSnapshot) => {
      const waypoints = dataSnapshot.val();
      if (waypoints && waypoints.length) {
        this.setState({ waypoints });
      }
    });
  }

  getWaypointDataSource = (waypoints) => {
    return dataSource.cloneWithRows(waypoints);
  };

  updateWaypoints = (waypoints, animateLastWaypoint = false) => {
    this.setState({ waypoints, addingWaypoint: false, animateLastWaypoint });
    firebaseRef.update({ waypoints });
  };

  createWaypoint = (waypoint) => {
    const waypoints = this.state.waypoints.concat(waypoint);
    this.updateWaypoints(waypoints, true);
  };

  deleteWaypoint = (index) => {
    const waypoints = this.state.waypoints.slice();
    waypoints.splice(index, 1);
    this.updateWaypoints(waypoints);
  };

  replaceWaypointAtIndex(index, newWaypoint) {
    const waypoints = this.state.waypoints.slice();
    waypoints.splice(index, 1, newWaypoint);
    this.updateWaypoints(waypoints);
  };

  renderWaypointDetail = (index) => {
    const { selectedWaypoint } = this.state;
    console.log(`arrivalURL: ${selectedWaypoint.arrivalURL}`);
    return (
      <ScrollView
        style={{
          padding: 20,
          backgroundColor: 'rgba(125, 125, 125, 0.5)',
          width: 390,
          height: 360,
        }}
      >
        <TextInput
          style={{
            height: 40,
            backgroundColor: 'white',
            marginBottom: 20,
            paddingHorizontal: 10,
          }}
          value={selectedWaypoint.title || ''}
          autoCapitalize={'none'}
          placeholder={'title'}
          returnKeyType={'next'}
          clearButtonMode={'while-editing'}
          onSubmitEditing={() => this.descriptionInput.focus()}
          onChangeText={(title) => {
            const selectedWaypoint = Object.assign({}, this.state.selectedWaypoint, { title });
            this.setState({ selectedWaypoint });
          }}
        />
        <TextInput
          style={{
            height: 150,
            backgroundColor: 'white',
            marginBottom: 20,
            paddingHorizontal: 10,
          }}
          autoCapitalize={'none'}
          ref={(component) => this.descriptionInput = component}
          multiline={true}
          value={selectedWaypoint.description || ''}
          placeholder={'description'}
          onChangeText={(description) => {
            const selectedWaypoint = Object.assign({}, this.state.selectedWaypoint, { description });
            this.setState({ selectedWaypoint });
          }}
        />
        <TextInput
          style={{
            height: 40,
            backgroundColor: 'white',
            marginBottom: 20,
            paddingHorizontal: 10,
          }}
          autoCapitalize={'none'}
          clearButtonMode={'always'}
          value={selectedWaypoint.arrivalURL || ''}
          placeholder={'arrival url'}
          onChangeText={(arrivalURL) => {
            const selectedWaypoint = Object.assign({}, this.state.selectedWaypoint, { arrivalURL });
            this.setState({ selectedWaypoint });
          }}
        />
        { // show WebView of arrival url if present
          isUri(selectedWaypoint.arrivalURL) && (
            <WebView
              source={{ uri: selectedWaypoint.arrivalURL || '' }}
              style={{ width: 320, height: 320, marginBottom: 20 }}
            />
          )
        }
        <TouchableOpacity
          style={{ marginBottom: 20 }}
          onPress={() => {
            AlertIOS.alert(
              `Delete ${selectedWaypoint.title || 'this waypoint'}?`,
              `There's no going back`,
              [
                { text: 'Cancel', style: 'cancel'},
                { text: 'Delete', style: 'destructive', onPress: () => this.deleteWaypoint(index) },
              ]
          );

          }}
        >
          <Text>{'delete this waypoint'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  renderWaypointListItem(waypoint) {
    return (
      <View
        style={{
          margin: 2,
          height: 50,
          backgroundColor: 'rgba(125, 125, 125, 0.5)'
        }}
      >
        <Text>{waypoint.title}</Text>
        <Text>{waypoint.description}</Text>
      </View>
    );
  }

  render() {
    const { region, waypoints, satellite, addingWaypoint, animateLastWaypoint, showWaypointList } = this.state;
    const { latitude, longitude } = region;


    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <MapView
          showsUserLocation={true}
          mapType={satellite ? 'satellite' : 'standard'}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
          onRegionChangeComplete={(region) => {
            region && this.setState({ region });
          }}
          annotations={waypoints.map((waypoint, index) => {
            const { longitude, latitude } = waypoint;
            return {
              longitude,
              latitude,
              onFocus: () => {
                this.setState({ selectedWaypoint: waypoints[index] });
              },
              onBlur: () => {
                this.replaceWaypointAtIndex(index, this.state.selectedWaypoint)
              },
              animateDrop: index === waypoints.length - 1 && animateLastWaypoint,
              draggable: false,
              title: `${index + 1} of ${waypoints.length}`,
              tintColor: 'blue',
              detailCalloutView: (() => {
                return this.renderWaypointDetail(index);
              })(),
            };
          })}
          overlays={[{
            coordinates: waypoints.map((waypoint) => {
              const { latitude, longitude } = waypoint;
              return { latitude, longitude };
            }),
            lineWidth: 5,
            strokeColor: 'turquoise',
            fillColor: 'darkgoldenrod',
          }]}
          showsPointsOfInterest={true}

        />
        {
          addingWaypoint && (
            <View
              style={{
                backgroundColor: 'red',
                height: 10,
                width: 10,
                borderRadius: 5,
                alignSelf: 'center',
                marginTop: 20
              }}
            />
          )
        }
        <TouchableOpacity
          style={{
            backgroundColor: 'transparent',
            position: 'absolute',
            bottom: 30,
            left: 20,
          }}
          onPress={() => {
            if (!this.state.addingWaypoint) {
              this.setState({ addingWaypoint: true });
            } else {
              const { latitude, longitude } = this.state.region;
              this.createWaypoint({ latitude, longitude });
            }
          }}
          onLongPress={() => {
            this.setState({ addingWaypoint: false });
          }}
        >
          <Text
            style={{
              fontSize: 50,
              color: 'red',
            }}
          >
            {addingWaypoint ? 'confirm' : 'add waypoint'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: 'transparent',
            position: 'absolute',
            bottom: 100,
            left: 20,
          }}
          onPress={() => {
            this.setState({ satellite: !this.state.satellite });
          }}
        >
          <Text
            style={{
              fontSize: 50,
              color: 'red',
            }}
          >
            {`turn satellite ${satellite ? 'off' : 'on'}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: 'transparent',
            position: 'absolute',
            bottom: 160,
            left: 20,
          }}
          onPress={() => {
            this.setState({ showWaypointList: !this.state.showWaypointList });
          }}
        >
          <Text
            style={{
              fontSize: 50,
              color: 'red',
            }}
          >
            {`${showWaypointList ? 'hide' : 'show'} waypoint list`}
          </Text>
        </TouchableOpacity>
        {
          showWaypointList && (
            <ListView
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                position: 'absolute',
                right: 0,
                bottom: 0,
                top: 0,
                width: 400,
              }}
              dataSource={this.getWaypointDataSource(waypoints)}
              renderRow={this.renderWaypointListItem}
            />
          )
        }
      </View>

    );
  }
}

AppRegistry.registerComponent('Dargons', () => Dargons);
