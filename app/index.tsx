import { Redirect } from 'expo-router';

/** Launch lands on ENTER THE KENNEL. */
export default function Index() {
  return <Redirect href="/enter" />;
}
