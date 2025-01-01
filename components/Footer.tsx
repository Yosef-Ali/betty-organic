const Footer = () => {
  return (
    <footer className="p-4 text-center border-t border-gray-200/60 w-full">
      <p>&copy; {new Date().getFullYear()} Betty Organic. All rights reserved.</p>
      <p className="text-sm text-gray-600 mt-1">
        Developed by <a href="mailto:dev.yosef@gmail.com" className="hover:text-yellow-600 underline">dev.yosef@gmail.com</a>
      </p>
    </footer>
  );
};

export default Footer;
