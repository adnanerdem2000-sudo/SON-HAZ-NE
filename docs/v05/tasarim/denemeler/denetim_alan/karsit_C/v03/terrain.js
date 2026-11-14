export const terrain = { h: -10, heightAt(x, z) { return this.h; }, normalAt(x,z,o){ o=o||{x:0,y:1,z:0}; o.x=0;o.y=1;o.z=0; return o; } };
