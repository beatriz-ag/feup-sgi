# SGI 2022/2023 - TP1

## Group: T04G11

| Name             | Number    | E-Mail               |
| ---------------- | --------- | -------------------- |
| Beatriz Aguiar   | 201906230 | up201906230@fe.up.pt |
| João Marinho     | 201905952 | up201905952@fe.up.pt |

----
## Project information

Main implementation points:
- Successful implementation of all proposed features.
- Verification and removal of "back edges" which introduce cycles in the given graph.
- Single validation of graph components, meaning no further conditional statements need to be executed when displaying each node, i.e., unused components defined in the XML file are removed from the graph before starting the display process.
- Implementation of the light's attenuation.

Scene:
- Can be described as a recreation of the Solar System. Contains all of it's planets, the sun, a realistic sattelite, and a spaceship.
- [Scene link](./scenes/space.xml)
- [Screenshots folder](./screenshots/)
----
## Issues/Problems

Most relevant problems and how they were solved:

- **Problem**: An early implementation of the file parsing did not allow for child components to be defined after the parent component, as a consequence of the order in which the components were traversed.
**Solution**: To face the above challenge and have a well-implemented solution we decided to verify the component existence only after traversing all nodes, but with the caveat of doing it before displaying the latter.

- **Problem**: The use of the lights was one of our main issues, mainly because of the colossal size of the planets and the astronomical distance between them. Only constant attenuation lighting had some effect on our elements (in both spot and omni), both linear and quadratic had little to no effect in the scene. This led to either having a bright scene, in which planets seemed to radiate, or a dark scene, where everything but the sun (emissive) was blackish.
**Solution**: Even though we were advised to only accept attenuations with values 0 or 1, we decided to accept real numbers in between these values to obtain the light attenuation effect. For example, the sun is 8000+ units away from the planets and for the light to reach Neptune, the linear attenuation has to have a value of 0.0004.