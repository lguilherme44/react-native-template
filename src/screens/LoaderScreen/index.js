import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { styles } from './styles';
import codePush from 'react-native-code-push';
//import OneSignal from 'react-native-onesignal';
import { appColors } from 'utils/appColors';
import { useSelector } from 'react-redux';
import { goLoginScreen } from 'appNavigation/nonAuthRoutes';
import { goMainScreen } from 'appNavigation/authRoutes';

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.MANUAL,
};

const LoaderScreen = () => {
  const [localState, setLocalState] = React.useState({
    haveUpdate: false,
    totalBytes: 0,
    receivedBytes: 0,
  });
  const { appInitialized } = useSelector(state => state.app);
  const { token } = useSelector(state => state.login);
  const { userProfile: user } = useSelector(state => state.me.profile);

  const initializeApp = () => {
    if (appInitialized) {
      if (token && user) {
        goMainScreen();
      } else {
        goLoginScreen();
      }
    }
  };

  const handleCodePushStatusChange = (status: SyncStatus) => {
    const { UP_TO_DATE, UPDATE_IGNORED } = codePush.SyncStatus;
    if ([UP_TO_DATE, UPDATE_IGNORED].includes(status)) {
      // CodePush sync flow done -> Notify the app is ready
      initializeApp();
    }
  };

  const checkForUpdate = async () => {
    const update = await codePush.checkForUpdate();
    if (update && update.isMandatory) {
      setLocalState(old => ({
        ...old,
        haveUpdate: true,
      }));
      const { IMMEDIATE } = codePush.InstallMode;
      return await codePush.sync(
        { installMode: IMMEDIATE },
        handleCodePushStatusChange,
        progress =>
          setLocalState(old => ({
            ...old,
            totalBytes: progress.totalBytes,
            receivedBytes: progress.receivedBytes,
          }))
      );
    }
    initializeApp();
  };

  //const onIds = data => {};

  // React.useEffect(() => {
  //   OneSignal.init('');
  //   OneSignal.addEventListener('ids', onIds);
  //   return () => OneSignal.removeEventListener('ids', onIds);
  // }, []);
  React.useEffect(() => {
    if (appInitialized) {
      checkForUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appInitialized]);

  const renderSyncStatus = () => {
    const status =
      (localState.receivedBytes / localState.totalBytes).toFixed(1) * 100;
    return Number.isNaN(status) ? '0%' : `${status}%`;
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator color={appColors.white} size={'large'} />
      {localState.haveUpdate && (
        <View>
          <Text style={styles.updateMessage}>
            O app está sendo atualizado. Por favor aguarde...
          </Text>
          <Text style={styles.updateStatus}>{renderSyncStatus()}</Text>
        </View>
      )}
    </View>
  );
};

export default codePush(codePushOptions)(LoaderScreen);
