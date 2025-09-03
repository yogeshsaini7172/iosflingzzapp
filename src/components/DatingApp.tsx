import InstagramUI from "@/components/InstagramUI";

const DatingApp = () => {
  return <InstagramUI onNavigate={(view) => console.log("Navigate:", view)} />;
};

export default DatingApp;
