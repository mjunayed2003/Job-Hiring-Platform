let data = "";
const useTestHook = (value) => {
  function set(value) {
    data = value;
    // console.log("=========>", value);
  }
//   console.log(data, "==");

  return { data, set };
};

export default useTestHook;

const test = new (class {
  data = "";

  set(name) {
    this.data = name;
  }
})();

// export test
