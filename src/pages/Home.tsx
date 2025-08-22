import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
const logo = process.env.PUBLIC_URL + '/logo.svg';
import AuthButtons from '../components/AuthButtons';
import ChatHistory from '../components/ChatHistory';
import './Home.css';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <img src={logo} alt="RFP EZ Logo" style={{ height: 40, marginRight: 12, verticalAlign: 'middle' }} />
          <IonTitle style={{ display: 'inline', verticalAlign: 'middle' }}>RFP EZ</IonTitle>
          <div style={{ float: 'right' }}>
            <AuthButtons />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <img src={logo} alt="RFP EZ Logo" style={{ height: 32, marginRight: 10, verticalAlign: 'middle' }} />
            <IonTitle size="large" style={{ display: 'inline', verticalAlign: 'middle' }}>RFP EZ</IonTitle>
          </IonToolbar>
        </IonHeader>
  <ChatHistory />
      </IonContent>
    </IonPage>
  );
};

export default Home;
