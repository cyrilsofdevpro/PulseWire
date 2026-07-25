import type { GetServerSideProps, NextPage } from 'next';

const AdminRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/pulsewire/admin',
    permanent: false
  }
});

export default AdminRedirectPage;
